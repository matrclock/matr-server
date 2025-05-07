# matr-server
Server for Matr Clock dumb clients. Sort of. It's some node nonsense running a loop, fronted by Nginx and Cloudflare. Good enough.

This generates a clock.gif, which in theory could run on the Pico, but at like 4FPS. The code for doing animated GIFs is in the matr-proto repo if for some reason you wanted to display the GIF directly. I really don't think you should.

The other file is clock.bin, which is directly decoded from clock.gif and runs at closer to 16FPS. This is what the current implementation actually uses.

