import { terser } from 'rollup-plugin-terser'
import typescript from 'rollup-plugin-typescript2'

const plugins = [
    typescript({
        tsconfig: 'tsconfig.json',
        removeComments: true,
        useTsconfigDeclarationDir: true,
    })
]

export default {
    input: 'src/index.ts',
    output: [
        { file: 'dist/mvvm.js', format: 'umd', name: 'mvvm', plugins: [terser()], sourcemap: true },
        { file: 'dist/mvvm.esm.js', format: 'esm', sourcemap: true },
        { file: 'example/mvvm.esm.js', format: 'esm', sourcemap: true },
    ],
    plugins,
}