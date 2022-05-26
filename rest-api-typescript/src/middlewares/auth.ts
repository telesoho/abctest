/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { logger } from '../logger';
import passport from 'passport';
import { NextFunction, Request, Response } from 'express';
import { HeaderAPIKeyStrategy } from 'passport-headerapikey';
import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import * as config from '../config';

import {
  Strategy as JWTStrategy,
  ExtractJwt,
  StrategyOptions,
} from 'passport-jwt';

const { UNAUTHORIZED } = StatusCodes;

const fabricAPIKeyStrategy: HeaderAPIKeyStrategy = new HeaderAPIKeyStrategy(
  { header: 'X-API-Key', prefix: '' },
  false,
  function (apikey, done) {
    logger.debug({ apikey }, 'Checking X-API-Key');
    if (apikey === config.org1ApiKey) {
      const user = config.mspIdOrg1;
      logger.debug('User set to %s', user);
      done(null, user);
    } else if (apikey === config.org2ApiKey) {
      const user = config.mspIdOrg2;
      logger.debug('User set to %s', user);
      done(null, user);
    } else {
      logger.debug({ apikey }, 'No valid X-API-Key');
      return done(null, false);
    }
  }
);

passport.use(fabricAPIKeyStrategy);

export const authenticateApiKey = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  passport.authenticate(
    'headerapikey',
    { session: false },
    (err, user, _info) => {
      if (err) return next(err);
      if (!user)
        return res.status(UNAUTHORIZED).json({
          status: getReasonPhrase(UNAUTHORIZED),
          reason: 'NO_VALID_APIKEY',
          timestamp: new Date().toISOString(),
        });

      req.logIn(user, { session: false }, async (err) => {
        if (err) {
          return next(err);
        }
        return next();
      });
    }
  )(req, res, next);
};

// 2 passport-jwtの設定
const opts: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
};

passport.use(
  new JWTStrategy(opts, (jwt_payload: any, done: any) => {
    done(null, jwt_payload);
  })
);

export const authenticateJwt = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  passport.authenticate('jwt', { session: false }, (err, user, _info) => {
    if (err) return next(err);
    if (!user)
      return res.status(UNAUTHORIZED).json({
        status: getReasonPhrase(UNAUTHORIZED),
        reason: 'NO_VALID_JWT',
        timestamp: new Date().toISOString(),
      });

    req.logIn(user, { session: false }, async (err) => {
      if (err) {
        return next(err);
      }
      return next();
    });
  })(req, res, next);
};

// 3 passportをexport
export default passport;