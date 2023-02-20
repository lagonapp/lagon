import Editor, { useMonaco } from '@monaco-editor/react';
import useTheme from 'lib/hooks/useTheme';
import { useEffect } from 'react';

type PlaygroundProps = {
  defaultValue: string;
  width?: string;
  height?: string;
};

const Playground = ({ defaultValue, width, height }: PlaygroundProps) => {
  const monaco = useMonaco();
  const { theme } = useTheme();

  useEffect(() => {
    if (monaco) {
      monaco.editor.setTheme(theme === 'Dark' ? 'vs-dark' : 'vs-light');
    }
  }, [theme, monaco]);

  useEffect(() => {
    if (monaco) {
      monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false,
      });

      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        lib: ['es2015', 'dom'],
        allowNonTsExtensions: true,
      });
    }
  }, [monaco]);

  return (
    <Editor
      width={width}
      height={height}
      options={{
        minimap: {
          enabled: false,
        },
        fontSize: 14,
        overviewRulerBorder: false,
      }}
      language="typescript"
      defaultValue={defaultValue}
    />
  );
};

export default Playground;
