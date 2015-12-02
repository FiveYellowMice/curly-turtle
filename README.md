# Curly Turtle

Web proxy for searching on Google privately.

## The story

In some areas of the earth, we can't have free internet (when we speak of free, we are referring to freedom, not price). Therefore people will need to find ways to access a relatively free internet. First we have HTTP proxy and VPN, but they are vulnerable and easy to censor. Then there is a great software called [Shadowsocks](https://github.com/Long-live-shadowsocks/shadowsocks), it's fast, secure and easy-to-setup. However, users have to install clients in order to use it, which is a bit hard on some platforms, or when you are travelling.

But web proxies don't have that restriction. Once you set it up on your server, you can access them with only a web browser, through HTTP or (better) HTTTPS. When you request a web page, the server grab the things from internet it can access, and send back to you. Curly Turtle is a web proxy concentrated on searching on Google.

I'm not saying web proxies can replace tunnel proxies like Shadowsocks, I just say it's more convenient to do one thing. In Curly Turtle's case, it's searching on Google, but only Google, no more.

## Installing

*You only need to install it on a server, no client required.*

First you need to have `nodejs` version 5 or higher and `npm` version 3 or higher, see [Node.js official download page](https://nodejs.org/en/download/stable/) for detials.

Then run the following command **as root**:

	npm install curly-turtle -g

Ignore the warinings that says something replaces something. You can access the program by the command `curly-turtle`. Run `curly-turtle --help` for help.

## Accessing

**Note: Currently Curly Turtle doesn't support HTTPS connections, which is dangerous. It will be added in later versions, but for now, you can [set up a reverse proxy with Nginx](https://gist.github.com/soheilhy/8b94347ff8336d971ad0).**

When you run `curly-turtle` without any arguments, it listens on port 8081. You can access it with your web browser, type `you-server-ip:8081` in the address bar, for example, `123.234.345.456:8081` if your server IP is 123.234.345.456.

If everything goes right, you will see a friendly web page.

## Disguising

You can specify a path, which if you know that path, you can access Curly Turtle. But if not, a 404 response looks Nginx will be returned, therefore people without the path can not access Curly Turtle on your server.

For example, if you run with command `curly-turtle --baseurl /google/IQXuB6IbPUg9ca4O`, you can only access Curly Turtle with address `http://you-server-ip:8081/google/IQXuB6IbPUg9ca4O/`.

**Note: As currently Curly Turtle does not support HTTPS connections, such kind of disguise will not prevent sniffers get your path. Anyway, use a reverse proxy as said below.**

## License

[GNU General Public License 3.0](LICENSE)
