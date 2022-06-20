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
      monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false,
      });

      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        lib: ['es2015'],
        allowNonTsExtensions: true,
      });

      const code = `declare interface RequestInit {
          method?: string;
          headers?: Record<string, string | string[] | undefined>;
          body?: string;
        }

        declare class Request {
          constructor(input: string, options?: RequestInit);

          method: string;
          headers: Record<string, string | string[] | undefined>;
          body?: string;
          url: string;

          text(): string;
          json(): object;
          formData(): Record<string, string>;
        }

        declare interface ResponseInit {
          status?: number;
          statusText?: string;
          headers?: Record<string, string | string[] | undefined>;
          url?: string;
        }

        declare class Response {
          constructor(body?: string, options?: ResponseInit);

          body: string;
          headers?: Record<string, string | string[] | undefined>;
          ok: boolean;
          status: number;
          statusText: string;
          url: string;

          text(): string;
          json(): object;
          formData(): Record<string, string>;
        }

        declare function fetch(resource: string, init?: RequestInit): Promise<Response>;
        `;
      const file = 'ts:filename/lagon.d.ts';

      monaco.languages.typescript.typescriptDefaults.addExtraLib(code, file);

      if (!monaco.editor.getModel(monaco.Uri.parse(file))) {
        monaco.editor.createModel(code, 'typescript', monaco.Uri.parse(file));
      }
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
