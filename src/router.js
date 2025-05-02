import Router from "koa-router";
import clock from "./elements/clock/index.js";

const router = new Router();

router.get(`/`, async (ctx) => {
  /*
  ctx.body = new Date().toLocaleTimeString(`en-us`, {
    hour12: false,
  });
  */
  ctx.type = `image/gif`;
  ctx.body = await clock();
  return ctx;
});
router.post(`/`, (ctx) => (ctx.body = `Event Posted!`));

export default router;
