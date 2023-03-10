import Koa from "koa";
import parser from "koa-bodyparser";
import router from "./router.js";

const App = new Koa();
const port = 8000;

App.use(parser())
  .use(router.routes())
  .listen(port, () => {
    console.log(`Listening on http://127.0.0.1:${port}/`);
  });
