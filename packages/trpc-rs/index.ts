import * as ts from 'typescript';
import { Project } from 'ts-morph';

const project = new Project({
  tsConfigFilePath: '../website/tsconfig.json',
});

const checker = project.getTypeChecker();

const source = project.getSourceFile('../website/pages/api/trpc/[trpc].ts');
const node = source?.getTypeAlias('AppRouter')?.getNameNode();
const type = checker.getTypeAtLocation(node!);
// const type = source?.getTypeAlias('AppRouter');
// const properties = type?.getType()?.getProperties();
const properties = type.getProperties();

properties
  ?.filter(
    symbol => !['_def', 'errorFormatter', 'transformer', 'createCaller', 'getErrorShape'].includes(symbol.getName()),
  )
  .forEach(symbol => {
    if (symbol.getName() === 'functionGet') {
      // const type = symbol.getDeclaredType();
      const type = checker.getTypeAtLocation(symbol.getValueDeclarationOrThrow());

      const def = type.getProperty('_def');
      const defType = checker.getTypeAtLocation(def!.getValueDeclarationOrThrow());

      const input = defType.getProperty('_input_in');
      const inputType = checker.getTypeAtLocation(input!.getValueDeclarationOrThrow());
    }
  });

// // const parsedCommandLine = ts.parseCommandLine(['tsc', '--noEmit']);
// // console.log(parsedCommandLine.fileNames);
//
// // @ts-ignore
// const diagosticReporter = ts.createDiagnosticReporter(ts.sys);
// // @ts-ignore
// const config = ts.parseConfigFileWithSystem(
//   '../website/tsconfig.json',
//   {},
//   // @ts-ignore
//   new ts.Map(),
//   undefined,
//   ts.sys,
//   diagosticReporter,
// );
//
// const program = ts.createProgram({
//   rootNames: config.fileNames,
//   options: config.options,
// });
// const checker = program.getTypeChecker();
//
// const sourceFile = program.getSourceFile('../website/pages/api/trpc/[trpc].ts');
// let appRouterType: ts.Type | undefined;
//
// ts.forEachChild(sourceFile!, node => {
//   if (ts.isTypeAliasDeclaration(node) && node.name.escapedText === 'AppRouter') {
//     appRouterType = checker.getTypeAtLocation(node.name);
//   }
// });
//
// type Procedure = {
//   name: string;
//   input?: Record<string, unknown>;
//   output?: Record<string, unknown>;
// };
//
// const procedures = appRouterType
//   ?.getProperties()
//   .filter(
//     symbol =>
//       !['_def', 'errorFormatter', 'transformer', 'createCaller', 'getErrorShape'].includes(
//         symbol.escapedName as string,
//       ),
//   )
//   .map(symbol => {
//     const procedure: Procedure = {
//       name: symbol.escapedName as string,
//     };
//
//     // @ts-ignore
//     const type = symbol.type as ts.Type;
//     const def = type.getProperty('_def');
//
//     const extractInputOutput = (defType: ts.Type, propertyName: string) => {
//       const property = defType.getProperty(propertyName);
//
//       // @ts-ignore
//       const properties = property.syntheticOrigin.type.modifiersType?.resolvedProperties as ts.Symbol[];
//
//       if (procedure.name === 'accountUpdate') {
//         // @ts-ignore
//         console.log(property);
//       }
//
//       return properties?.reduce(
//         (acc, property) => ({
//           ...acc,
//           [property.escapedName as string]: 'value todo',
//         }),
//         {},
//       );
//     };
//
//     // @ts-ignore
//     const defType = def.type as ts.Type;
//
//     // procedure.input = extractInputOutput(defType, '_input_in');
//     procedure.output = extractInputOutput(defType, '_output_in');
//
//     return procedure;
//   });
//
// // console.log(JSON.stringify(procedures, null, 2));
