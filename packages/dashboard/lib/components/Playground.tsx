import Editor, { useMonaco } from '@monaco-editor/react';
import { useEffect } from 'react';

type PlaygroundProps = {
  defaultValue: string;
  width?: string;
  height?: string;
};

const Playground = ({ defaultValue, width, height }: PlaygroundProps) => {
  const monaco = useMonaco();

  useEffect(() => {
    if (monaco) {
      const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            const darkMode = (mutation.target as HTMLElement).classList.contains('dark');

            monaco.editor.setTheme(darkMode ? 'vs-dark' : 'vs-light');
          }
        });
      });

      observer.observe(document.documentElement, {
        attributes: true,
      });

      return () => {
        observer.disconnect();
      };
    }
  }, [monaco]);

  useEffect(() => {
    if (monaco) {
      monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false,
      });

      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        lib: ['esnext', 'dom', 'dom.iterable'],
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
