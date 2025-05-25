betatable@Mac opaque-urls-v01 % pnpm i && pnpm build
Lockfile is up to date, resolution step is skipped
Already up to date
Done in 284ms using pnpm v10.11.0

> longurl@0.1.0 build /Users/betatable/Desktop/beastmode/opaque-urls-v01
> tsc

index.ts:117:56 - error TS2339: Property 'baseUrl' does not exist on type 'LongURLConfig'.

117       const domain = this.config.domain || this.config.baseUrl || 'https://longurl.co';
                                                           ~~~~~~~

index.ts:189:9 - error TS2353: Object literal may only specify known properties, and 'originalUrl' does not exist in type 'ResolutionResult<any>'.

189         originalUrl: data.original_url,
            ~~~~~~~~~~~

index.ts:249:7 - error TS2322: Type '{ urlId: any; entityType: any; clickedAt: any; }[]' is not assignable to type '{ urlId: string; entityType: string; timestamp: Date; userAgent?: string | undefined; ip?: string | undefined; }[]'.
  Property 'timestamp' is missing in type '{ urlId: any; entityType: any; clickedAt: any; }' but required in type '{ urlId: string; entityType: string; timestamp: Date; userAgent?: string | undefined; ip?: string | undefined; }'.

249       recentClicks
          ~~~~~~~~~~~~

  types.ts:137:5
    137     timestamp: Date;
            ~~~~~~~~~
    'timestamp' is declared here.
  types.ts:134:3
    134   recentClicks: Array<{
          ~~~~~~~~~~~~
    The expected type comes from property 'recentClicks' which is declared here on type 'AnalyticsData'


Found 3 errors in the same file, starting at: index.ts:117

 ELIFECYCLE  Command failed with exit code 2.
betatable@Mac opaque-urls-v01 % 