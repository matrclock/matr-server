# matr-server
Server for Matr Clock clients. Serves on port 8080, though the docker-compose.yml includes configuration for a cloudflare tunnel. You'll need to point the settings.toml for your clock where ever this is hosted.

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
