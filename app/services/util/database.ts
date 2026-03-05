import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

/*
 * 01. 구분     : Service
 * 02. 타입     : -
 * 03. 업무구분  : 모든권한 - database
 * 03. 설명     : database 제공
 * 04. 작성일자  : 2023.12.20
 * 05. 작성자   : 이희준
 */

dotenv.config();

let connectMongoDB: Promise<MongoClient>;
let prisma: PrismaClient;

if (process.env.NODE_ENV === 'development') {
  if (!global._mongo) {
    global._mongo = new MongoClient(process.env.MONGO_URL as string).connect();
  }
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
  connectMongoDB = global._mongo;
} else {
  connectMongoDB = new MongoClient(process.env.MONGO_URL as string).connect();
  prisma = new PrismaClient();
}
export { connectMongoDB, prisma };
