import { Request, Response } from 'express';
import { InventoryService } from './inventory.service';
import { InventoryRequest } from './inventory.model';
import { InventoryRepository } from './inventory.repository';

export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  async createItem(req: InventoryRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant!.id;
      const item = await this.service.createItem(tenantId, req.body);
      res.status(201).json(item);
    } catch (error) {
      if (error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  async updateItem(req: InventoryRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant!.id;
      const itemId = req.params.id;
      const item = await this.service.updateItem(tenantId, itemId, req.body);
      res.json(item);
    } catch (error) {
      if (error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  async getItem(req: InventoryRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant!.id;
      const itemId = req.params.id;
      const item = await this.service.getItem(tenantId, itemId);

      if (!item) {
        res.status(404).json({ error: 'Item not found' });
        return;
      }

      res.json(item);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async listItems(req: InventoryRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant!.id;
      const result = await this.service.listItems(tenantId, req.query);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async adjustStock(req: InventoryRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant!.id;
      const movement = await this.service.adjustStock(tenantId, req.body);
      res.json(movement);
    } catch (error) {
      if (error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
}

export const inventoryController = new InventoryController(
  new InventoryService(new InventoryRepository())
);
