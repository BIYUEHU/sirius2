// tsup.config.ts
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "tsup";
import { config } from "dotenv";
var __injected_dirname__ = "G:\\repos\\sirius2";
config();
var pkg = JSON.parse(readFileSync(resolve(__injected_dirname__, "package.json"), "utf-8"));
function parseVersion(versionStr) {
  const parts = versionStr.split(".").map(Number);
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
}
var tsup_config_default = defineConfig(({ define }) => {
  const isRelease = define?.release !== void 0;
  const bundleName = `${pkg.name}-${pkg.version}-${Date.now()}-${isRelease ? "prod" : "dev"}`;
  const versionType = (isRelease ? define?.is_client_version !== void 0 : process.env.IS_CLIENT_VERSION === "on") ? "client" : "server";
  const DIR = resolve(
    __injected_dirname__,
    !isRelease && process.env.OUT_DIR ? process.env.OUT_DIR : "dist",
    isRelease ? `${versionType}/${pkg.name}-${pkg.version}` : pkg.name
  );
  if (existsSync(DIR)) rmdirSync(DIR, { recursive: true });
  mkdirSync(DIR, { recursive: true });
  writeFileSync(
    resolve(DIR, "manifest.json"),
    JSON.stringify(
      {
        format_version: 2,
        header: {
          name: pkg.name || "unknown",
          description: pkg.description || "",
          uuid: pkg.mcBuild.uuid[0],
          version: parseVersion(pkg.version || "1.0.0"),
          min_engine_version: [1, 20, 0],
          license: pkg.license || "",
          url: pkg.homepage || ""
        },
        modules: [
          {
            type: "script",
            language: "javascript",
            uuid: pkg.mcBuild.uuid[1],
            version: parseVersion(pkg.version || "1.0.0"),
            entry: `scripts/${bundleName}/main.js`
          }
        ],
        dependencies: Object.entries(pkg.dependencies || {}).filter(
          ([name]) => name.startsWith("@minecraft/") && (versionType === "server" || name !== "@minecraft/server-net")
        ).map(([module_name, version]) => ({
          module_name,
          version: version.split(".").slice(0, 3).join(".")
        }))
      },
      null,
      2
    )
  );
  mkdirSync(resolve(DIR, "scripts"), { recursive: true });
  pkg.mcBuild.transform.map((value) => typeof value === "string" ? [value, value] : value).map(([input, output]) => copyFileSync(resolve(__injected_dirname__, input), resolve(DIR, output)));
  const outDir = resolve(DIR, `scripts/${bundleName}`);
  return {
    entryPoints: ["./src/main.ts", `./src/${versionType}.ts`],
    minify: isRelease,
    outDir,
    name: `${versionType}/${bundleName.split("-").pop()}`,
    bundle: true,
    format: ["esm"],
    tsconfig: "tsconfig.json",
    banner: {
      js: `
/**
 * @Package ${pkg.name ?? "unknown"}
 * @Version ${pkg.version ?? "unknown"}
 * @Author ${Array.isArray(pkg.author) ? pkg.author.join(", ") : pkg.author ?? ""}
 * @Copyright 2025 Arimura Sena. All rights reserved.
 * @License ${pkg.license ?? "GPL-3.0"}
 * @Link ${pkg.homepage ?? ""}
 * @Date ${(/* @__PURE__ */ new Date()).toLocaleString()}
 */
${pkg.mcBuild.header.join("\n")}
`
    },
    outExtension(ctx) {
      return {
        js: ".js"
      };
    },
    async onSuccess() {
      writeFileSync(
        resolve(outDir, "main.js"),
        `import AdapterDataSome from './${versionType}.js';
${readFileSync(resolve(outDir, "main.js"), "utf-8")}`
      );
      console.log(`Build ${isRelease ? "Release" : "Dev"} ${versionType} ${pkg.name} v${pkg.version} success!`);
    }
  };
});
export {
  tsup_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidHN1cC5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9faW5qZWN0ZWRfZmlsZW5hbWVfXyA9IFwiRzpcXFxccmVwb3NcXFxcc2lyaXVzMlxcXFx0c3VwLmNvbmZpZy50c1wiO2NvbnN0IF9faW5qZWN0ZWRfZGlybmFtZV9fID0gXCJHOlxcXFxyZXBvc1xcXFxzaXJpdXMyXCI7Y29uc3QgX19pbmplY3RlZF9pbXBvcnRfbWV0YV91cmxfXyA9IFwiZmlsZTovLy9HOi9yZXBvcy9zaXJpdXMyL3RzdXAuY29uZmlnLnRzXCI7aW1wb3J0IHsgY29weUZpbGVTeW5jLCBleGlzdHNTeW5jLCBta2RpclN5bmMsIHJlYWRGaWxlU3luYywgcm1kaXJTeW5jLCB3cml0ZUZpbGVTeW5jIH0gZnJvbSAnbm9kZTpmcydcclxuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gJ25vZGU6cGF0aCdcclxuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndHN1cCdcclxuaW1wb3J0IHsgY29uZmlnIH0gZnJvbSAnZG90ZW52J1xyXG5cclxuY29uZmlnKClcclxuXHJcbmNvbnN0IHBrZyA9IEpTT04ucGFyc2UocmVhZEZpbGVTeW5jKHJlc29sdmUoX19kaXJuYW1lLCAncGFja2FnZS5qc29uJyksICd1dGYtOCcpKVxyXG5cclxuZnVuY3Rpb24gcGFyc2VWZXJzaW9uKHZlcnNpb25TdHI6IHN0cmluZyk6IFtudW1iZXIsIG51bWJlciwgbnVtYmVyXSB7XHJcbiAgY29uc3QgcGFydHMgPSB2ZXJzaW9uU3RyLnNwbGl0KCcuJykubWFwKE51bWJlcilcclxuICByZXR1cm4gW3BhcnRzWzBdIHx8IDAsIHBhcnRzWzFdIHx8IDAsIHBhcnRzWzJdIHx8IDBdXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBkZWZpbmUgfSkgPT4ge1xyXG4gIGNvbnN0IGlzUmVsZWFzZSA9IGRlZmluZT8ucmVsZWFzZSAhPT0gdW5kZWZpbmVkXHJcbiAgY29uc3QgYnVuZGxlTmFtZSA9IGAke3BrZy5uYW1lfS0ke3BrZy52ZXJzaW9ufS0ke0RhdGUubm93KCl9LSR7aXNSZWxlYXNlID8gJ3Byb2QnIDogJ2Rldid9YFxyXG4gIGNvbnN0IHZlcnNpb25UeXBlID0gKGlzUmVsZWFzZSA/IGRlZmluZT8uaXNfY2xpZW50X3ZlcnNpb24gIT09IHVuZGVmaW5lZCA6IHByb2Nlc3MuZW52LklTX0NMSUVOVF9WRVJTSU9OID09PSAnb24nKVxyXG4gICAgPyAnY2xpZW50J1xyXG4gICAgOiAnc2VydmVyJ1xyXG4gIGNvbnN0IERJUiA9IHJlc29sdmUoXHJcbiAgICBfX2Rpcm5hbWUsXHJcbiAgICAhaXNSZWxlYXNlICYmIHByb2Nlc3MuZW52Lk9VVF9ESVIgPyBwcm9jZXNzLmVudi5PVVRfRElSIDogJ2Rpc3QnLFxyXG4gICAgaXNSZWxlYXNlID8gYCR7dmVyc2lvblR5cGV9LyR7cGtnLm5hbWV9LSR7cGtnLnZlcnNpb259YCA6IHBrZy5uYW1lXHJcbiAgKVxyXG5cclxuICBpZiAoZXhpc3RzU3luYyhESVIpKSBybWRpclN5bmMoRElSLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KVxyXG4gIG1rZGlyU3luYyhESVIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pXHJcblxyXG4gIHdyaXRlRmlsZVN5bmMoXHJcbiAgICByZXNvbHZlKERJUiwgJ21hbmlmZXN0Lmpzb24nKSxcclxuICAgIEpTT04uc3RyaW5naWZ5KFxyXG4gICAgICB7XHJcbiAgICAgICAgZm9ybWF0X3ZlcnNpb246IDIsXHJcbiAgICAgICAgaGVhZGVyOiB7XHJcbiAgICAgICAgICBuYW1lOiBwa2cubmFtZSB8fCAndW5rbm93bicsXHJcbiAgICAgICAgICBkZXNjcmlwdGlvbjogcGtnLmRlc2NyaXB0aW9uIHx8ICcnLFxyXG4gICAgICAgICAgdXVpZDogcGtnLm1jQnVpbGQudXVpZFswXSxcclxuICAgICAgICAgIHZlcnNpb246IHBhcnNlVmVyc2lvbihwa2cudmVyc2lvbiB8fCAnMS4wLjAnKSxcclxuICAgICAgICAgIG1pbl9lbmdpbmVfdmVyc2lvbjogWzEsIDIwLCAwXSxcclxuICAgICAgICAgIGxpY2Vuc2U6IHBrZy5saWNlbnNlIHx8ICcnLFxyXG4gICAgICAgICAgdXJsOiBwa2cuaG9tZXBhZ2UgfHwgJydcclxuICAgICAgICB9LFxyXG4gICAgICAgIG1vZHVsZXM6IFtcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgdHlwZTogJ3NjcmlwdCcsXHJcbiAgICAgICAgICAgIGxhbmd1YWdlOiAnamF2YXNjcmlwdCcsXHJcbiAgICAgICAgICAgIHV1aWQ6IHBrZy5tY0J1aWxkLnV1aWRbMV0sXHJcbiAgICAgICAgICAgIHZlcnNpb246IHBhcnNlVmVyc2lvbihwa2cudmVyc2lvbiB8fCAnMS4wLjAnKSxcclxuICAgICAgICAgICAgZW50cnk6IGBzY3JpcHRzLyR7YnVuZGxlTmFtZX0vbWFpbi5qc2BcclxuICAgICAgICAgIH1cclxuICAgICAgICBdLFxyXG4gICAgICAgIGRlcGVuZGVuY2llczogT2JqZWN0LmVudHJpZXMocGtnLmRlcGVuZGVuY2llcyB8fCB7fSlcclxuICAgICAgICAgIC5maWx0ZXIoXHJcbiAgICAgICAgICAgIChbbmFtZV0pID0+IG5hbWUuc3RhcnRzV2l0aCgnQG1pbmVjcmFmdC8nKSAmJiAodmVyc2lvblR5cGUgPT09ICdzZXJ2ZXInIHx8IG5hbWUgIT09ICdAbWluZWNyYWZ0L3NlcnZlci1uZXQnKVxyXG4gICAgICAgICAgKVxyXG4gICAgICAgICAgLm1hcCgoW21vZHVsZV9uYW1lLCB2ZXJzaW9uXSkgPT4gKHtcclxuICAgICAgICAgICAgbW9kdWxlX25hbWUsXHJcbiAgICAgICAgICAgIHZlcnNpb246ICh2ZXJzaW9uIGFzIHN0cmluZykuc3BsaXQoJy4nKS5zbGljZSgwLCAzKS5qb2luKCcuJylcclxuICAgICAgICAgIH0pKVxyXG4gICAgICB9LFxyXG4gICAgICBudWxsLFxyXG4gICAgICAyXHJcbiAgICApXHJcbiAgKVxyXG4gIG1rZGlyU3luYyhyZXNvbHZlKERJUiwgJ3NjcmlwdHMnKSwgeyByZWN1cnNpdmU6IHRydWUgfSlcclxuXHJcbiAgcGtnLm1jQnVpbGQudHJhbnNmb3JtXHJcbiAgICAubWFwKCh2YWx1ZSkgPT4gKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgPyBbdmFsdWUsIHZhbHVlXSA6IHZhbHVlKSlcclxuICAgIC5tYXAoKFtpbnB1dCwgb3V0cHV0XSkgPT4gY29weUZpbGVTeW5jKHJlc29sdmUoX19kaXJuYW1lLCBpbnB1dCksIHJlc29sdmUoRElSLCBvdXRwdXQpKSlcclxuXHJcbiAgY29uc3Qgb3V0RGlyID0gcmVzb2x2ZShESVIsIGBzY3JpcHRzLyR7YnVuZGxlTmFtZX1gKVxyXG5cclxuICByZXR1cm4ge1xyXG4gICAgZW50cnlQb2ludHM6IFsnLi9zcmMvbWFpbi50cycsIGAuL3NyYy8ke3ZlcnNpb25UeXBlfS50c2BdLFxyXG4gICAgbWluaWZ5OiBpc1JlbGVhc2UsXHJcbiAgICBvdXREaXIsXHJcbiAgICBuYW1lOiBgJHt2ZXJzaW9uVHlwZX0vJHtidW5kbGVOYW1lLnNwbGl0KCctJykucG9wKCl9YCxcclxuICAgIGJ1bmRsZTogdHJ1ZSxcclxuICAgIGZvcm1hdDogWydlc20nXSxcclxuICAgIHRzY29uZmlnOiAndHNjb25maWcuanNvbicsXHJcbiAgICBiYW5uZXI6IHtcclxuICAgICAganM6IGBcclxuLyoqXHJcbiAqIEBQYWNrYWdlICR7cGtnLm5hbWUgPz8gJ3Vua25vd24nfVxyXG4gKiBAVmVyc2lvbiAke3BrZy52ZXJzaW9uID8/ICd1bmtub3duJ31cclxuICogQEF1dGhvciAke0FycmF5LmlzQXJyYXkocGtnLmF1dGhvcikgPyBwa2cuYXV0aG9yLmpvaW4oJywgJykgOiBwa2cuYXV0aG9yID8/ICcnfVxyXG4gKiBAQ29weXJpZ2h0IDIwMjUgQXJpbXVyYSBTZW5hLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxyXG4gKiBATGljZW5zZSAke3BrZy5saWNlbnNlID8/ICdHUEwtMy4wJ31cclxuICogQExpbmsgJHtwa2cuaG9tZXBhZ2UgPz8gJyd9XHJcbiAqIEBEYXRlICR7bmV3IERhdGUoKS50b0xvY2FsZVN0cmluZygpfVxyXG4gKi9cclxuJHtwa2cubWNCdWlsZC5oZWFkZXIuam9pbignXFxuJyl9XHJcbmBcclxuICAgIH0sXHJcbiAgICBvdXRFeHRlbnNpb24oY3R4KSB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAganM6ICcuanMnXHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBhc3luYyBvblN1Y2Nlc3MoKSB7XHJcbiAgICAgIHdyaXRlRmlsZVN5bmMoXHJcbiAgICAgICAgcmVzb2x2ZShvdXREaXIsICdtYWluLmpzJyksXHJcbiAgICAgICAgYGltcG9ydCBBZGFwdGVyRGF0YVNvbWUgZnJvbSAnLi8ke3ZlcnNpb25UeXBlfS5qcyc7XFxuJHtyZWFkRmlsZVN5bmMocmVzb2x2ZShvdXREaXIsICdtYWluLmpzJyksICd1dGYtOCcpfWBcclxuICAgICAgKVxyXG4gICAgICBjb25zb2xlLmxvZyhgQnVpbGQgJHtpc1JlbGVhc2UgPyAnUmVsZWFzZScgOiAnRGV2J30gJHt2ZXJzaW9uVHlwZX0gJHtwa2cubmFtZX0gdiR7cGtnLnZlcnNpb259IHN1Y2Nlc3MhYClcclxuICAgIH1cclxuICB9XHJcbn0pXHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBb00sU0FBUyxjQUFjLFlBQVksV0FBVyxjQUFjLFdBQVcscUJBQXFCO0FBQ2hTLFNBQVMsZUFBZTtBQUN4QixTQUFTLG9CQUFvQjtBQUM3QixTQUFTLGNBQWM7QUFINEMsSUFBTSx1QkFBdUI7QUFLaEcsT0FBTztBQUVQLElBQU0sTUFBTSxLQUFLLE1BQU0sYUFBYSxRQUFRLHNCQUFXLGNBQWMsR0FBRyxPQUFPLENBQUM7QUFFaEYsU0FBUyxhQUFhLFlBQThDO0FBQ2xFLFFBQU0sUUFBUSxXQUFXLE1BQU0sR0FBRyxFQUFFLElBQUksTUFBTTtBQUM5QyxTQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FB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
