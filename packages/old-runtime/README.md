# Lagon
JavaScript Serverless Runtime

## API
```ts
const deployment: Deployment = {
  functionId: 'custom-id',
  deploymentId: 'custom-id',
  domains: ['localhost:3000'],
  memory: 128,
  timeout: 50,
  env: {
    hello: 'world',
  },
  isCurrent: true,
}

function getDeploymentCode(deployment) {
  return `export async function handler(request) {
    return new Response("Hello world!")
  }`
}

const runIsolate = await getIsolate({
  deployment,
  getDeploymentCode,
})

const request: HandlerRequest  = {
  input: '/test',
  options: {
    method: 'GET',
    headers: {},
    body: 'request body',
  },
}

const { response } = await runIsolate(request)
```

## Runtime

### Request
```ts
new Request(input [, options])
```

#### Constructor
- `input: string`
- `options?: RequestInit`

##### RequestInit
- `method?: string`
- `headers?: Record<string, string | string[] | undefined>`
- `body?: string`

#### Properties
- `method: string`
- `headers: Record<string, string | string[] | undefined>`
- `body: string`
- `url: string`

#### Methods
- `text(): Promise<string>`
- `json<T>(): Promise<T>`
- `formData(): Promise<Record<string, string>>`

### Response
```ts
new Response(body [, options])
```

#### Constructor
- `body: string`
- `options?: ResponseInit`

##### ResponseInit
- `status?: string`
- `statusText?: string`
- `headers?: Record<string, string | string[] | undefined>`
- `url?: string`

#### Properties
- `body: string`
- `headers: Record<string, string | string[] | undefined>`
- `ok: boolean`
- `status: number`
- `statusText: string`
- `url: string`

#### Methods
- `text(): Promise<string>`
- `json<T>(): Promise<T>`
- `formData(): Promise<Record<string, string>>`

## Fetch
```ts
fetch(resource [, init]): Promise<Response>
```

### Parameters
- `resource: string`
- `init?: RequestInit`

### Environment variables
```ts
MY_VARIABLE
```

### Console
```ts
console.log(...args: any[])
console.error(...args: any[])
console.info(...args: any[])
console.warn(...args: any[])
console.debug(...args: any[])
```
