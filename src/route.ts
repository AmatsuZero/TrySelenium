import { Connection, Repository } from 'typeorm';
import { NewListPage, ThreadInfo } from './newlist';
import DetailPage from './detail';
import { InfoModel } from "./entity/info";
import { findAvailableHost, Logger, ShouldCountinue } from './util';
import { ACGList, ACGDetailPage } from './acg';
import { NovelDetail, NovelList } from './novellist';
import { WesternDetail, WesternList } from './western';

const parseNewlistData = async (repo: Repository<InfoModel>, hrefs: ThreadInfo[]) => {
  for (const href of hrefs) {
    Logger.log(`ð å³å°è§£ææ°ä½åè¯¦æé¡µé¢ï¼${href.href}`);
    const detail = new DetailPage(href.href, href.tag);
    try {
      const info = await detail.extractInfo();
      if (info === undefined) {
        continue;
      }
      await repo.save(info);
      Logger.log(`ðº è§£æå®æ: ${href.tag}-${info.title}`);
    } catch (e) {
      ShouldCountinue();
      Logger.error(`â è§£æä¿å­å¤±è´¥: ${href.tag}-${href.href}`);
      Logger.error(e);
    }
  }
};

const parseACGListData = async (repo: Repository<InfoModel>, hrefs: ThreadInfo[]) => {
  for (const href of hrefs) {
    Logger.log(`ð å³å°è§£æACGè¯¦æé¡µé¢ï¼${href.href}`);
    const detail = new ACGDetailPage(href.href, href.tag);
    try {
      const info = await detail.extractInfo();
      if (info === undefined) {
        continue;
      }
      await repo.save(info);
      Logger.log(`ðº è§£æå®æ: ${href.tag}-${info.title}`);
    } catch (e) {
      ShouldCountinue();
      Logger.error(`â è§£æä¿å­å¤±è´¥: ${href.tag}-${href.href}`);
      Logger.error(e);
    }
  }
};

const parseNoveListData = async (repo: Repository<InfoModel>, hrefs: ThreadInfo[]) => {
  for (const href of hrefs) {
    Logger.log(`ð å³å°è§£æå°è¯´è¯¦æé¡µé¢ï¼${href.href}`);
    const detail = new NovelDetail(href.href, href.tag);
    try {
      const info = await detail.extractInfo();
      if (info === undefined) {
        continue;
      }
      await repo.save(info);
      Logger.log(`ðº è§£æå®æ: ${href.tag}-${info.title}`);
    } catch (e) {
      ShouldCountinue();
      Logger.error(`â è§£æä¿å­å¤±è´¥: ${href.tag}-${href.href}`);
      Logger.error(e);
    }
  }
};

const parseWesternListData = async (repo: Repository<InfoModel>, hrefs: ThreadInfo[]) => {
  for (const href of hrefs) {
    Logger.log(`ð å³å°è§£ææ¬§ç¾åºè¯¦æé¡µé¢ï¼${href.href}`);
    const detail = new WesternDetail(href.href, href.tag);
    try {
      const info = await detail.extractInfo();
      if (info === undefined) {
        continue;
      }
      await repo.save(info);
      Logger.log(`ðº è§£æå®æ: ${href.tag}-${info.title}`);
    } catch (e) {
      ShouldCountinue();
      Logger.error(`â è§£æä¿å­å¤±è´¥: ${href.tag}-${href.href}`);
      Logger.error(e);
    }
  }
};

const beforeParse = async (connection: Connection, category: string, hasHistoryData: boolean) => {
  const host = await findAvailableHost();
  if (host.length === 0) {
    throw new Error("â æ²¡æå¯ä»¥è®¿é®çåå");
  } else {
    Logger.log(`âï¸ ä½¿ç¨ååä¸ºï¼${host}`);    
  }
  let latestId = -1;
  let earliestId = -1;
  if (!hasHistoryData) {
    Logger.log("ð» æ¬å°æ²¡æåå²æ°æ®ï¼å¨æ°å¼å§ï½");
  } else {
    const repo = connection.getRepository(InfoModel);
    Logger.log("ð» æåå²æ°æ®ï¼æ´æ°æ·»å ï½");
    // æ¥æ¾æååææ°ä¸æ¡æ°æ®ç thread id
    const latest = await repo.findOne({
      where: [{ category }],
      order: { threadId: 'DESC' }
    });
    if (latest !== undefined) {
      Logger.log(`ð  åå²æ°æ®ææ°ä¸æ¡æ¯ï¼${latest.threadId}ï¼${latest.title}`);
      latestId = latest.threadId;
    }
    const earliest = await repo.findOne({
      where: [{ category }],
      order: { threadId: 'ASC' }
    });
    if (earliest !== undefined) {
      Logger.log(`ð  åå²æ°æ®ææ©ä¸æ¡æ¯ï¼${earliest.threadId}ï¼${earliest.title}`);
      earliestId = earliest.threadId;
    }
    earliestId = earliest !== undefined ? earliest.threadId : -1;
  }
  return {
    host,
    latestId,
    earliestId
  }
};

const parseNewListPage = async (connection: Connection, startPage: number, hasHistoryData: boolean) => {
  const { host, latestId, earliestId } = await beforeParse(connection, "new", hasHistoryData);
  Logger.log('â¨ å¼å§è§£ææ°ä½ååè¡¨');
  const newListPage = new NewListPage(host, latestId, earliestId);
  newListPage.currentPage = startPage;
  const repo = connection.getRepository(InfoModel);
  newListPage.dbRepo = repo;
  await newListPage.getAllThreadLinks(async (hrefs) => parseNewlistData(repo, hrefs));
  Logger.log('â¨ è§£ææ°ä½ååè¡¨ç»æ');
};

const parseACGListPage = async (connection: Connection, startPage: number, hasHistoryData: boolean) => {
  const { host, latestId, earliestId } = await beforeParse(connection, "acg", hasHistoryData);
  Logger.log('â¨ å¼å§è§£æ ACG åè¡¨');
  const acgList = new ACGList(host, latestId, earliestId);
  const repo = connection.getRepository(InfoModel);
  acgList.currentPage = startPage;
  acgList.dbRepo = repo;
  await acgList.getAllThreadLinks(async (hrefs) => parseACGListData(repo, hrefs));
  Logger.log('â¨ è§£æ ACG åè¡¨ç»æ');
};

const parseNoveListPage = async (connection: Connection, startPage: number, hasHistoryData: boolean) => {
  const { host, latestId, earliestId } = await beforeParse(connection, "novel", hasHistoryData);
  Logger.log('â¨ å¼å§è§£æå°è¯´åè¡¨');
  const list = new NovelList(host, latestId, earliestId);
  const repo = connection.getRepository(InfoModel);
  list.currentPage = startPage;
  list.dbRepo = repo;
  await list.getAllThreadLinks(async (hrefs) => parseNoveListData(repo, hrefs));
  Logger.log('â¨ è§£æå°è¯´åè¡¨ç»æ');
};

const parseWesternListPage = async (connection: Connection, startPage: number, hasHistoryData: boolean) => {
  const { host, latestId, earliestId } = await beforeParse(connection, "non-asian", hasHistoryData);
  Logger.log('â¨ å¼å§æ¬§ç¾åºåè¡¨');
  const list = new WesternList(host, latestId, earliestId);
  const repo = connection.getRepository(InfoModel);
  list.currentPage = startPage;
  list.dbRepo = repo;
  await list.getAllThreadLinks(async (hrefs) => parseWesternListData(repo, hrefs));
  Logger.log('â¨ è§£ææ¬§ç¾åºåè¡¨ç»æ');
};

const updateNewTags = async (connection: Connection) => {
  const { host, latestId, earliestId } = await beforeParse(connection, "new", true);
  const newListPage = new NewListPage(host, latestId, earliestId);
  newListPage.dbRepo = connection.getRepository(InfoModel);
  Logger.log('â¨ å¼å§æ´æ°æ°åè¡¨æ ç­¾');
  await newListPage.updateTags();
  Logger.log('â¨ æ´æ°æ°åè¡¨æ ç­¾ç»æ');
}

const specifiedPages = async (connection: Connection, pages: ThreadInfo[]) => {
  Logger.log("ð§ å¼å§è§£æåç¬é¡µé¢");
  const repo = connection.getRepository(InfoModel);
  await parseNewlistData(repo, pages);
};

const resume = async (connection: Connection, start: number, pages: ThreadInfo[]) => {
  // é²æ­¢æ¢å¤é¡µé¢ä¸­å¤±è´¥ï¼è¿èä¸¢å¤±ä¸æ¬¡æ¯æ¢å¤å°ç¬¬å é¡µäºï¼åæä¸ä¸ªä¿¡æ¯åºæ¥
  if (start > 1) {
    Logger.log(`ð§ ä»ä¸æ¬¡æ¥å¿æ¢å¤ï¼${start}`);
  } else {
    Logger.log("ð§ ä»ä¸æ¬¡æ¥å¿æ¢å¤");
  }
  if (pages.length > 0) {
    Logger.log(`ð§ è¦éæ°å°è¯ä¸è½½çä½åæï¼\n${pages.join("\n")}`);
  }
  await specifiedPages(connection, pages);
  await parseNewListPage(connection, start, true);
};

export {
  parseNewlistData,
  parseNewListPage,
  parseACGListPage,
  parseNoveListPage,
  parseWesternListPage,
  updateNewTags,
  specifiedPages,
  resume,
}