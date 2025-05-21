import { Request } from 'express';
import { User } from '../auth/auth.types';
import { Tenant } from '../tenant/tenant.types';
import { Device } from '../device/device.types';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      tenant?: Tenant;
      device?: Device;
    }
  }
}
