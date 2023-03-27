import Koa from "koa";
import parser from "koa-bodyparser";
import router from "./router.js";

const App = new Koa();
const port = 8000;

App.use(parser())
  .use(router.routes())
  .listen(port, `0.0.0.0`, () => {
    console.log(`Listening on port ${port}`);
  });
