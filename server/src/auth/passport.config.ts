import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { JWT_SECRET } from './auth.constants';

// Create a connection pool to PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Additional connection options if needed
});

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, created_at FROM users WHERE id = $1',
      [id]
    );
    const user = result.rows[0];
    done(null, user);
  } catch (error) {
    done(error);
  }
});

passport.use(
  new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      try {
        const result = await pool.query(
          'SELECT * FROM users WHERE email = $1',
          [email]
        );

        const user = result.rows[0];

        if (!user) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// JWT Strategy for API authentication
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: JWT_SECRET,
    },
    async (jwtPayload, done) => {
      try {
        // First, check if the user exists
        const userResult = await pool.query(
          'SELECT id, email, name FROM users WHERE id = $1',
          [jwtPayload.userId]
        );

        const user = userResult.rows[0];

        if (!user) {
          return done(null, false);
        }

        // If tenantId is in the JWT, check if user belongs to that tenant
        if (jwtPayload.tenantId) {
          const tenantResult = await pool.query(
            'SELECT tenant_id, roles FROM tenant_users WHERE user_id = $1 AND tenant_id = $2',
            [jwtPayload.userId, jwtPayload.tenantId]
          );

          const tenantUser = tenantResult.rows[0];

          if (!tenantUser) {
            return done(null, false, {
              message: 'User does not belong to the specified tenant',
            });
          }

          // Add tenant context and roles to the user object
          user.currentTenantId = jwtPayload.tenantId;
          user.roles = tenantUser.roles;
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Device JWT Strategy for device authentication
passport.use(
  'device-jwt',
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: JWT_SECRET,
    },
    async (jwtPayload, done) => {
      try {
        // Validate that this is a device token (it should have deviceId)
        if (!jwtPayload.deviceId) {
          return done(null, false, { message: 'Invalid device token' });
        }

        // Check if the device exists and is associated with the specified tenant
        const deviceResult = await pool.query(
          'SELECT id, tenant_id, name FROM devices WHERE id = $1 AND tenant_id = $2',
          [jwtPayload.deviceId, jwtPayload.tenantId]
        );

        const device = deviceResult.rows[0];

        if (!device) {
          return done(null, false, {
            message: 'Device not found or not authorized for this tenant',
          });
        }

        return done(null, device);
      } catch (error) {
        return done(error);
      }
    }
  )
);

export default passport;
