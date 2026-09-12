# Masters of IGCSE Chemistry

This folder is the independent app repository root. **src/** is its source of
truth; **dist/** is generated publishing output. 5 existing activities are
included. Open src/index.html directly in Edge or Chrome for a local preview.

## Release

Run from this app folder with Node 22 or newer:

```powershell
npm.cmd run build
npm.cmd run check
```

No dependency installation is required. release.json explicitly lists approved
activities and runtime files. Builds use a fresh staging folder, validate links,
case, JavaScript and dependencies, then replace dist/. A rejected build retains
the last successful dist/. The check command also rejects stale or extra output.

index.html is the canonical landing page. Existing long-form homepage filenames
redirect to it, retaining query parameters and fragments for old bookmarks.
Internal home links go directly to index.html. Preserve storage keys and IDs
when editing existing activities.

Each app owns its runtime assets. The small common asset copies are independent,
not a shared runtime package. Source documentation, alternative mastery sources,
question-source JSON and portable outputs are excluded from release selection.
Keep the font licence in published assets/fonts/.

## Publish when ready

For manual browser upload, upload the **contents of dist/** to the repository
root, including .nojekyll. Do not upload the enclosing folder or the development
workspace. Review removals explicitly when replacing an existing website.

For the maintained source repository, use main and set Settings > Pages > Source
to **GitHub Actions** before pushing this src/ layout. Once connected, run the
manual **Publish Pages** workflow from main. It builds and checks this app and
uploads only dist/. Ordinary pushes do not deploy. Keep the existing GCSE remote
name/address when migrating it, and preserve its Git history.

Official guidance: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

## Development

In the containing chemistry workspace, drafts stay in development/igcse/drafts/;
chemistry generators and browser reviews stay in scripts/. Nothing outside this
repository is required to build or serve its approved website. Generated
chemistry data is committed here; regeneration uses the documented workspace
toolchain and retained curriculum sources.

The containing workspace's npm.cmd test exercises chemistry and release
selection. npm.cmd run review checks both sites under repository URL prefixes,
local-file use, pupil/teacher modes, home layouts and explicit draft previews.

The GCSE baseline is the working 55-file upload supplied on 9 September 2026. Recall/statistics panels and the newer printed-ID footer remain local drafts. Rocket Recall remains directly accessible at activities/rocket-recall/index.html.
