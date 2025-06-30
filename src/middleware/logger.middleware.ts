import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import chalk from 'chalk';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const start = process.hrtime(); 
    const now = new Date().toISOString();

    // Log request
    console.log(chalk.blue(`[${now}]`) + ' ' + chalk.green(`${req.method} ${req.originalUrl}`));

    // Log response on finish
    res.on('finish', () => {
      const diff = process.hrtime(start); 
      const timeInMs = (diff[0] * 1e3 + diff[1] / 1e6).toFixed(2);

      const statusColor =
        res.statusCode >= 500
          ? chalk.red
          : res.statusCode >= 400
            ? chalk.yellow
            : res.statusCode >= 300
              ? chalk.cyan
              : chalk.green;

      console.log(
        chalk.blue(`[${now}]`) +
          ' ' +
          chalk.green(`${req.method} ${req.originalUrl}`) +
          ' -> ' +
          statusColor(res.statusCode.toString()) +
          chalk.magenta(` (${timeInMs} ms)`)
      );
    });

    next();
  }
}
