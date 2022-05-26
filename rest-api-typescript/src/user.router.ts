import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import { Contract } from 'fabric-network';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';
import * as config from './config';
import { Queue } from 'bullmq';
import { evatuateTransaction } from './fabric';
import { logger } from './logger';
import { buildCAClient, registerAndEnrollUser } from './utils/CAUtil';
import * as path from 'path';

const { INTERNAL_SERVER_ERROR, OK } = StatusCodes;

export const userRouter = express.Router();

userRouter.post(
  '/',
  body().isObject().withMessage('body must contain an user object'),
  body('username', 'user name you wish to register. must be a string').notEmpty(),
  body('role','role').notEmpty(),
  async (req: Request, res: Response) => {
    logger.debug('Register and enroll user to fabric network');

    const mspId = req.user as string;

    try {
        // build an in memory object with the network configuration (also known as a connection profile)
        const ccp = config.connectionProfileOrg1;
        const caClient = buildCAClient(ccp, 'ca.org1.example.com');
       
        // in a real application this would be done on an administrative flow, and only once
        console.log(req.body)
        await registerAndEnrollUser(caClient, req.app.locals.wallet, config.mspIdOrg1, req.body.username, 'org1.department1', req.body.role);

        return res.status(OK).json(req.body);
    } catch (err) {
      logger.error({ err }, 'Error processing init ledger');

      return res.status(INTERNAL_SERVER_ERROR).json({
        status: getReasonPhrase(INTERNAL_SERVER_ERROR),
        timestamp: new Date().toISOString(),
      });
    }
  }
);

userRouter.get('/', async (req: Request, res: Response) => {
  logger.debug('Get all user enroll to fabric network');
  try {
    const mspId = req.user as string;
    const contract = req.app.locals[mspId]?.assetContract as Contract;

    const data = await evatuateTransaction(contract, 'GetAllAssets');
    let assets = [];
    if (data.length > 0) {
      assets = JSON.parse(data.toString());
    }

    return res.status(OK).json(assets);
  } catch (err) {
    logger.error({ err }, 'Error processing get all assets request');
    return res.status(INTERNAL_SERVER_ERROR).json({
      status: getReasonPhrase(INTERNAL_SERVER_ERROR),
      timestamp: new Date().toISOString(),
    });
  }
});

userRouter.get('/test', async (req: Request, res: Response) => {
  logger.debug('test');
  return res.status(OK).json({
    message: 'ok',
    timestamp: new Date().toISOString(),
  });
});
