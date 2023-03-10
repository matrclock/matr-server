import Koa from "koa";
import parser from "koa-bodyparser";

const App = new Koa();
const port = 8000;

App.use(parser()).listen(port, () => {
  console.log(`Listening on http://127.0.0.1:${port}/`);
});
