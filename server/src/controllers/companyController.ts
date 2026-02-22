import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import type { AuthRequest } from '../global';

export const listCompanies = async (_req: Request, res: Response) => {
  const companies = await prisma.company.findMany({
    orderBy: { name: 'asc' },
  });
  res.json(companies);
};

export const createCompany = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  const userRole = req.userRole;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  if (userRole !== 'EMPLOYEE' && userRole !== 'ADMIN') {
    return res.status(403).json({ error: 'Only employees can create companies' });
  }

  const { name, domain, description, logoUrl } = req.body;
  if (!name || !domain || typeof name !== 'string' || typeof domain !== 'string') {
    return res.status(400).json({ error: 'Name and domain are required' });
  }

  const cleanName = name.trim();
  const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
  if (!cleanDomain) {
    return res.status(400).json({ error: 'Invalid domain' });
  }

  const existing = await prisma.company.findFirst({
    where: {
      OR: [
        { name: { equals: cleanName, mode: 'insensitive' } },
        { domain: cleanDomain },
      ],
    },
  });
  if (existing) {
    return res.status(400).json({ error: 'Company with this name or domain already exists' });
  }

  const company = await prisma.company.create({
    data: {
      name: cleanName,
      domain: cleanDomain,
      description: description?.trim() || null,
      logoUrl: logoUrl?.trim() || null,
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { companyId: company.id },
  });

  res.status(201).json(company);
};
