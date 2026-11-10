const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const esbuild = require('esbuild');

const projectRoot = path.resolve(__dirname, '..');
const vendorDir = path.join(projectRoot, 'src', 'vendor');
const outFile = path.join(vendorDir, 'plotly-dcp.js');

const traceModules = ['bar', 'scatter', 'histogram', 'heatmap', 'box', 'pie', 'scatterpolar'];

function sh(command, cwd) {
    execSync(command, {
        cwd,
        stdio: 'inherit',
        env: process.env
    });
}

function installPlotlyDependencies(plotlyRepoDir) {
    const npmArgs = '--ignore-scripts --no-audit --no-fund';
    const lockFilePath = path.join(plotlyRepoDir, 'package-lock.json');

    if (fs.existsSync(lockFilePath)) {
        // Prefer deterministic installs to avoid surprise transitive dependency changes in CI.
        sh(`npm ci ${npmArgs}`, plotlyRepoDir);
        return;
    }

    sh(`npm i ${npmArgs}`, plotlyRepoDir);
}

function getPlotlyVersion() {
    // Use the installed package version to select a matching upstream tag.
    const version = require('plotly.js/package.json').version;
    if (!version) {
        throw new Error('Unable to resolve plotly.js version from node_modules');
    }

    return version;
}

async function buildFromPlotlySource() {
    const plotlyVersion = getPlotlyVersion();
    const plotlyTag = `v${plotlyVersion}`;
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'plotly-custom-bundle-'));
    const plotlyRepoDir = path.join(tempRoot, 'plotly.js');
    const plotlyDistFile = path.join(plotlyRepoDir, 'dist', 'plotly-dcp.min.js');

    console.log(`[plotly] Building custom bundle from upstream tag ${plotlyTag}`);

    try {
        sh(`git clone --depth 1 --branch ${plotlyTag} https://github.com/plotly/plotly.js.git ${plotlyRepoDir}`);
        // Keep optional deps (esbuild platform binaries) but skip install scripts to avoid node-gyp/Python requirements in CI.
        installPlotlyDependencies(plotlyRepoDir);
        sh(`npm run custom-bundle -- --traces ${traceModules.join(',')} --out dcp`, plotlyRepoDir);

        if (!fs.existsSync(plotlyDistFile)) {
            throw new Error(`Expected custom bundle was not generated: ${plotlyDistFile}`);
        }

        const entryContents = [
            `const PlotlyMod = require(${JSON.stringify(plotlyDistFile)});`,
            'const Plotly = PlotlyMod && PlotlyMod.default ? PlotlyMod.default : PlotlyMod;',
            "if (!Plotly || typeof Plotly.newPlot !== 'function') throw new Error('Invalid Plotly custom bundle output');",
            'module.exports = Plotly;'
        ].join('\n');

        await esbuild.build({
            stdin: {
                contents: entryContents,
                loader: 'js',
                resolveDir: projectRoot,
                sourcefile: 'plotly-dcp-source-entry.cjs'
            },
            outfile: outFile,
            bundle: true,
            format: 'esm',
            platform: 'browser',
            target: ['es2018'],
            minify: true,
            legalComments: 'none'
        });

        console.log(`[ok] Built Plotly DCP bundle from source: ${path.relative(projectRoot, outFile)} (traces: ${traceModules.join(', ')})`);
    } finally {
        fs.rmSync(tempRoot, { recursive: true, force: true });
    }
}

async function build() {
    try {
        fs.mkdirSync(vendorDir, { recursive: true });
        await buildFromPlotlySource();
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
}

build();
