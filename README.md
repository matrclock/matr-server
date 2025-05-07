# matr-server
Server for Matr Clock clients. Sort of. It's some node nonsense running a loop, fronted by Nginx and Cloudflare. Good enough. I guess you'd need a cloudflare token. Look, if you've gotten this far you can probably figure out how to run a loop and serve 2 files right?

This generates a clock.gif, which in theory could run on the Pico, but at like 4FPS. The code for doing animated GIFs is in the matr-proto repo if for some reason you wanted to display the GIF directly. I really don't think you should.

The other file is clock.bin, which is directly decoded from clock.gif and runs at closer to 16FPS. This is what the current implementation actually uses.

For the weather stuff you'll need a config.json in the root directory with a Google AI API key. Here's an example

```
{
    "sources": {
        "openai": {
            "key": "sk-proj-fjghvw894grht48v9nqpgbutpwrgbiquaiebrgfhqoiuv"
        },
        "google": {
            "key": "AIzauvuqh948720thg20780v"
        }
    }
```
