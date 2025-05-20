/**
 * IP and Location Tracking Service
 * Tracks IP and location data for authentication events to detect suspicious activities
 */

import { v4 as uuidv4 } from 'uuid';
import geoip from 'geoip-lite';
import pool from '../db/pool';
import { redisClient } from '../lib/redis';
import { SuspiciousLoginData } from './auth.types';

export class SecurityTrackingService {
  /**
   * Track login attempt and check for suspicious activity
   * @param userId - The user ID
   * @param ipAddress - The IP address of the login attempt
   * @param userAgent - The user agent string from the request
   * @returns Security assessment data
   */
  async trackLoginAttempt(
    userId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<{
    isSuspicious: boolean;
    riskLevel: 'low' | 'medium' | 'high';
    reasons: string[];
  }> {
    try {
      // Get geo location from IP
      const geo = geoip.lookup(ipAddress);
      const country = geo?.country || 'Unknown';
      const region = geo?.region || 'Unknown';
      const city = geo?.city || 'Unknown';

      // Get previous login data for this user
      const previousLoginsResult = await pool.query(
        `SELECT ip_address, location_country, location_region, user_agent, created_at 
         FROM auth_logs 
         WHERE user_id = $1 AND action = 'USER_LOGIN' AND status = 'SUCCESS'
         ORDER BY created_at DESC
         LIMIT 5`,
        [userId]
      );

      const previousLogins = previousLoginsResult.rows;

      // Process results and determine if login is suspicious
      const isSuspicious = false; // Default value
      const reasons: string[] = [];
      let riskLevel: 'low' | 'medium' | 'high' = 'low';

      // If this is the first login, we can't determine suspiciousness
      if (previousLogins.length > 0) {
        // Check for location changes
        const recentCountries = new Set(
          previousLogins.map((l) => l.location_country)
        );
        const recentRegions = new Set(
          previousLogins.map((l) => l.location_region)
        );

        // If the current country is different from all previous ones
        if (!recentCountries.has(country) && recentCountries.size > 0) {
          reasons.push('Login from a new country');
          riskLevel = 'medium';
        }

        // If the current region is different from all previous ones
        if (
          !recentRegions.has(region) &&
          recentRegions.size > 0 &&
          recentCountries.has(country)
        ) {
          reasons.push('Login from a new region');

          // Only elevate risk level if it's not already high
          if (riskLevel === 'low') {
            riskLevel = 'medium';
          }
        }

        // Check for rapid location change (impossible travel)
        if (previousLogins.length > 0) {
          const lastLogin = previousLogins[0];
          const lastLoginTime = new Date(lastLogin.created_at).getTime();
          const currentTime = Date.now();
          const hoursSinceLastLogin =
            (currentTime - lastLoginTime) / (1000 * 60 * 60);

          // If location changed and time between logins is suspiciously short
          if (
            lastLogin.location_country !== country &&
            hoursSinceLastLogin < 4 // Less than 4 hours between logins from different countries
          ) {
            reasons.push('Impossible travel detected between logins');
            riskLevel = 'high';
          }
        }

        // Check for user agent changes
        const recentUserAgents = new Set(
          previousLogins.map((l) => l.user_agent)
        );
        if (!recentUserAgents.has(userAgent) && recentUserAgents.size > 0) {
          reasons.push('Login from a new device or browser');

          // Only elevate to medium if it's currently low
          if (riskLevel === 'low') {
            riskLevel = 'medium';
          }
        }
      }

      // Record this login attempt
      await pool.query(
        `INSERT INTO auth_logs (
          id, user_id, action, ip_address, user_agent, 
          location_country, location_region, location_city, 
          status, risk_level, metadata, created_at
        ) VALUES (
          uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()
        )`,
        [
          userId,
          'USER_LOGIN',
          ipAddress,
          userAgent,
          country,
          region,
          city,
          'SUCCESS',
          riskLevel,
          JSON.stringify({ suspiciousReasons: reasons }),
        ]
      );

      // Store suspicious login data in Redis for quick access
      if (reasons.length > 0 && riskLevel !== 'low') {
        const suspiciousData: SuspiciousLoginData = {
          userId,
          ipAddress,
          country,
          region,
          city,
          userAgent,
          timestamp: new Date().toISOString(),
          riskLevel: riskLevel as 'medium' | 'high', // Only 'medium' or 'high' is allowed
          reasons,
        };

        // Add to suspicious login set with expiration of 30 days
        const key = `suspicious_login:${userId}`;
        await redisClient.set(
          key,
          JSON.stringify(suspiciousData),
          'EX',
          60 * 60 * 24 * 30 // 30 days
        );
      }

      return {
        isSuspicious: riskLevel !== 'low',
        riskLevel,
        reasons,
      };
    } catch (error) {
      console.error('Error tracking login attempt:', error);
      // Return safe default in case of errors
      return {
        isSuspicious: false,
        riskLevel: 'low',
        reasons: ['Error processing security check'],
      };
    }
  }

  /**
   * Get recent suspicious logins for a user
   * @param userId - The user ID
   * @returns List of suspicious login events
   */
  async getSuspiciousLogins(userId: string): Promise<SuspiciousLoginData[]> {
    try {
      // Query database for suspicious logins
      const suspiciousLoginsResult = await pool.query(
        `SELECT 
          id, user_id, ip_address, user_agent, 
          location_country, location_region, location_city, 
          risk_level, metadata, created_at
         FROM auth_logs 
         WHERE user_id = $1 
         AND action = 'USER_LOGIN' 
         AND risk_level IN ('medium', 'high')
         ORDER BY created_at DESC
         LIMIT 10`,
        [userId]
      );

      return suspiciousLoginsResult.rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        ipAddress: row.ip_address,
        country: row.location_country,
        region: row.location_region,
        city: row.location_city,
        userAgent: row.user_agent,
        timestamp: row.created_at,
        riskLevel: row.risk_level as 'medium' | 'high',
        reasons: row.metadata?.suspiciousReasons || [],
      }));
    } catch (error) {
      console.error('Error getting suspicious logins:', error);
      return [];
    }
  }

  /**
   * Block an IP address temporarily due to suspicious activity
   * @param ipAddress - The IP address to block
   * @param reason - The reason for blocking
   * @param duration - Duration in seconds (default: 1 hour)
   */
  async blockSuspiciousIP(
    ipAddress: string,
    reason: string,
    duration: number = 3600 // 1 hour by default
  ): Promise<void> {
    try {
      const key = `blocked_ip:${ipAddress}`;
      const data = {
        ipAddress,
        reason,
        blockedAt: new Date().toISOString(),
      };

      // Block IP in Redis
      await redisClient.set(key, JSON.stringify(data), 'EX', duration);

      // Log IP block
      await pool.query(
        `INSERT INTO auth_logs (
          id, action, ip_address, status, metadata, created_at
        ) VALUES (
          uuid_generate_v4(), $1, $2, $3, $4, NOW()
        )`,
        [
          'IP_BLOCKED',
          ipAddress,
          'SUCCESS',
          JSON.stringify({ reason, durationSeconds: duration }),
        ]
      );
    } catch (error) {
      console.error('Error blocking suspicious IP:', error);
    }
  }

  /**
   * Check if an IP address is blocked
   * @param ipAddress - The IP address to check
   * @returns Whether the IP is blocked and the reason
   */
  async isIPBlocked(ipAddress: string): Promise<{
    isBlocked: boolean;
    reason?: string;
    blockedAt?: string;
  }> {
    try {
      const key = `blocked_ip:${ipAddress}`;
      const result = await redisClient.get(key);

      if (result) {
        const data = JSON.parse(result);
        return {
          isBlocked: true,
          reason: data.reason,
          blockedAt: data.blockedAt,
        };
      }

      return { isBlocked: false };
    } catch (error) {
      console.error('Error checking if IP is blocked:', error);
      return { isBlocked: false };
    }
  }
}

export const securityTrackingService = new SecurityTrackingService();
