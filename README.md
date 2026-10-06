# Linux Muster Library

A small Node.js library for talking to the API of **[linuxmuster.net](https://docs.linuxmuster.net/de/latest/about/about.html)**.

linuxmuster.net is a server distribution made for running educational school networks. If you want the full picture, the [official documentation](https://docs.linuxmuster.net/de/latest/about/about.html) is the place to go (it's mostly in German). [Wikipedia](https://de.wikipedia.org/wiki/Linuxmuster.net) also has some nice background, including the history of the project and a few fun facts.

## Heads up

This is more of a proof of concept than a finished product. It's definitely not complete, but it works and it can be a decent base if you want to build on it.

- This library does **not** use the official API, but the **WebUI API / Component API** (/api/core/* , /api/lmn/* ), which also worked before the big 7.4 API update (only tested up to 7.3).
- All the admin APIs are missing. The public docs don't say much about them, and I'm only a student on the network, so I couldn't try them out. (Yes, I could set up my own linuxmuster server to test things, so maybe I'll actually do that someday.)

Anyway, maybe it helps someone.

## Honor to whom honor is due.
_Ehre wem Ehre gebührt_

Please note that I am not affiliated with the linuxmuster.net team or project, and I am not affiliated with or involved in the development of the official linuxmuster.net Python API.
This is an independent Node.js implementation created for experimentation and personal use.


## How to use it

It's not on NPM, so you have to add it manually. Copy index.js into your project.

The library is an ES module and depends on undici and validator:

```bash
npm install undici validator
```

Make sure your project uses ES modules ("type": "module" in your package.json) and a reasonably recent Node.js version.

Then import it:

```javascript
import muster from "./index.js";
```

And configure it before doing anything else:

```javascript
muster.configure({
    serverUrl: "https://server.example.com",
    allowUnsafe: false,
    shutup: false,
    debug: false,
});
```

After that, log in and use the session key for everything else:

```javascript
const session = await muster.login("username", "password");
const identity = await muster.getIdentity(session);
console.log(identity);
```

For all functions and their exact arguments, take a look at ./example.js. Every function is shown there with all of its arguments.

## About me

I'm a student and still learning, so some parts are a bit janky. Sorry about that. If you find something that could be better, feel free to open an issue or a pull request.

## AI usage

I wrote the code myself. At its core, this is human made. I only used AI (Claude Sonnet 5.5) as support to optimize some parts and to help with translation.

---

Open source is love. ❤️