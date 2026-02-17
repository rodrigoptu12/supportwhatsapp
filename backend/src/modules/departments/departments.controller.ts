import { Response, NextFunction } from 'express';
import { departmentsService } from './departments.service';
import { AuthRequest } from '../../shared/types';

export class DepartmentsController {
  async list(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const departments = await departmentsService.list();
      res.json(departments);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const department = await departmentsService.getById(req.params.id!);
      res.json(department);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const department = await departmentsService.create(req.body);
      res.status(201).json(department);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const department = await departmentsService.update(req.params.id!, req.body);
      res.json(department);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await departmentsService.delete(req.params.id!);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async getAttendants(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const attendants = await departmentsService.getAttendants(req.params.id!);
      res.json(attendants);
    } catch (error) {
      next(error);
    }
  }
}

export const departmentsController = new DepartmentsController();
