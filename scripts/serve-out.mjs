import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve, sep } from "node:path";

const root = resolve(process.cwd(), "out");
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "0.0.0.0";

if (!existsSync(join(root, "index.html"))) {
  console.error("No ./out build found. Run `pnpm build` first.");
  process.exit(1);
}

const MIME_TYPES = {
  ".avif": "image/avif",
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function isInsideRoot(filePath) {
  return filePath === root || filePath.startsWith(`${root}${sep}`);
}

function fileForPath(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }

  const relativePath = decoded.replace(/^\/+/u, "");
  let filePath = normalize(join(root, relativePath));
  if (!isInsideRoot(filePath)) return null;

  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = join(filePath, "index.html");
  } else if (!existsSync(filePath) && existsSync(`${filePath}.html`)) {
    filePath = `${filePath}.html`;
  } else if (!existsSync(filePath) && existsSync(join(filePath, "index.html"))) {
    filePath = join(filePath, "index.html");
  }

  return existsSync(filePath) && statSync(filePath).isFile() ? filePath : null;
}

const server = createServer((request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
  let filePath = fileForPath(url.pathname);

  if (!filePath && url.pathname === "/") {
    filePath = join(root, "index.html");
  }

  if (!filePath) {
    const notFound = join(root, "404.html");
    response.writeHead(404, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    });
    if (existsSync(notFound)) {
      createReadStream(notFound).pipe(response);
    } else {
      response.end("Not found");
    }
    return;
  }

  const extension = extname(filePath).toLowerCase();
  const isHashedAsset =
    filePath.includes(`${sep}_next${sep}static${sep}`) ||
    filePath.includes(`${sep}_next${sep}image`);
  response.writeHead(200, {
    "Content-Type": MIME_TYPES[extension] || "application/octet-stream",
    "Cache-Control": isHashedAsset
      ? "public, max-age=31536000, immutable"
      : "no-cache",
    "X-Content-Type-Options": "nosniff",
  });

  if (request.method === "HEAD") {
    response.end();
    return;
  }

  createReadStream(filePath).pipe(response);
});

server.listen(port, host, () => {
  console.log(`Static preview: http://localhost:${port}`);
  console.log(`Serving: ${root}`);
});
