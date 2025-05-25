betatable@Mac opaque-urls-v01 % find . -name "*.js" -not -path "./node_modules/*" -not -path "./dist/*" | head -find . -name "*.js" -not -path "./node_modules/*" -not -path "./dist/*" | head -10
./test-sample.js
./jest.config.js
betatable@Mac opaque-urls-v01 % ls -la src/ && echo "---" && ls -la dist/src/
total 64
drwxr-xr-x@  8 betatable  staff   256 May 24 22:14 .
drwxr-xr-x@ 22 betatable  staff   704 May 24 22:17 ..
drwxr-xr-x   7 betatable  staff   224 May 24 22:22 adapters
-rw-r--r--@  1 betatable  staff  7767 May 24 21:54 cli.ts
-rw-r--r--@  1 betatable  staff  3237 May 24 20:46 collision.ts
-rw-r--r--@  1 betatable  staff  2461 May 24 21:38 generator.ts
-rw-r--r--   1 betatable  staff  5156 May 24 22:15 index.ts
-rw-r--r--@  1 betatable  staff  4693 May 24 21:53 resolver.ts
---
total 112
drwxr-xr-x@ 13 betatable  staff   416 May 24 22:15 .
drwxr-xr-x@ 10 betatable  staff   320 May 21 08:04 ..
drwxr-xr-x@ 10 betatable  staff   320 May 24 22:15 adapters
-rw-r--r--@  1 betatable  staff   212 May 24 22:19 cli.d.ts
-rw-r--r--@  1 betatable  staff  9790 May 24 22:19 cli.js
-rw-r--r--@  1 betatable  staff   940 May 24 22:19 collision.d.ts
-rw-r--r--@  1 betatable  staff  3379 May 24 22:19 collision.js
-rw-r--r--@  1 betatable  staff   814 May 24 22:19 generator.d.ts
-rw-r--r--@  1 betatable  staff  2634 May 24 22:19 generator.js
-rw-r--r--@  1 betatable  staff  1403 May 24 22:19 index.d.ts
-rw-r--r--@  1 betatable  staff  5687 May 24 22:19 index.js
-rw-r--r--@  1 betatable  staff   873 May 24 22:19 resolver.d.ts
-rw-r--r--@  1 betatable  staff  5251 May 24 22:19 resolver.js
betatable@Mac opaque-urls-v01 % stat -f "%m" src/index.ts && stat -f "%m" dist/src/index.js
1748139331
1748139559
betatable@Mac opaque-urls-v01 % date -r 1748139331 && date -r 1748139559
Sat May 24 22:15:31 EDT 2025
Sat May 24 22:19:19 EDT 2025
betatable@Mac opaque-urls-v01 % mkdir -p src/core/storage
<eAdapter.ts src/adapters/supabase/SupabaseAdapter.ts
betatable@Mac opaque-urls-v01 % npm run build

> longurl@0.1.0 build
> tsc

betatable@Mac opaque-urls-v01 % npm test

> longurl@0.1.0 test
> jest


 FAIL  tests/generator.test.ts
  ● Test suite failed to run

    tests/generator.test.ts:2:10 - error TS2305: Module '"../types"' has no exported member 'EntityType'.

    2 import { EntityType, StorageStrategy } from '../types';
               ~~~~~~~~~~
    tests/generator.test.ts:27:14 - error TS18048: 'result.urlId' is possibly 'undefined'.

    27       expect(result.urlId.length).toBe(6);
                    ~~~~~~~~~~~~
    tests/generator.test.ts:28:28 - error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
      Type 'undefined' is not assignable to type 'string'.

    28       expect(validateUrlId(result.urlId)).toBe(true);
                                  ~~~~~~~~~~~~
    tests/generator.test.ts:52:14 - error TS18048: 'result.urlId' is possibly 'undefined'.

    52       expect(result.urlId.length).toBe(6);
                    ~~~~~~~~~~~~
    tests/generator.test.ts:87:14 - error TS18048: 'result.urlId' is possibly 'undefined'.

    87       expect(result.urlId.length).toBe(customLength);
                    ~~~~~~~~~~~~
    tests/generator.test.ts:88:28 - error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
      Type 'undefined' is not assignable to type 'string'.

    88       expect(validateUrlId(result.urlId, customLength)).toBe(true);
                                  ~~~~~~~~~~~~

 FAIL  tests/resolver.test.ts
  ● URL Resolver › resolveUrlId › should return error when URL ID not found

    expect(received).toBe(expected) // Object.is equality

    Expected: false
    Received: true

      172 |       );
      173 |       
    > 174 |       expect(result.success).toBe(false);
          |                              ^
      175 |       expect(result.error).toContain('No rows found');
      176 |       expect(result.entity).toBeUndefined();
      177 |     });

      at Object.<anonymous> (tests/resolver.test.ts:174:30)

  ● URL Resolver › resolveUrlId › should handle database errors gracefully

    expect(received).toBe(expected) // Object.is equality

    Expected: false
    Received: true

      194 |       );
      195 |       
    > 196 |       expect(result.success).toBe(false);
          |                              ^
      197 |       expect(result.error).toContain('Database connection error');
      198 |       expect(result.entity).toBeUndefined();
      199 |     });

      at Object.<anonymous> (tests/resolver.test.ts:196:30)

  ● URL Resolver › resolveUrlId › should use cached results when available

    expect(received).toEqual(expected) // deep equality

    - Expected  - 4
    + Received  + 3

      Object {
    -   "id": "insider-789",
    -   "insider_id": "insider-789",
    -   "name": "Jane Smith",
    -   "url_id": "Ef3G4h",
    +   "company_id": "company-456",
    +   "company_name": "Acme Corp",
    +   "ticker": "ACME",
      }

      220 |       
      221 |       expect(result1.success).toBe(true);
    > 222 |       expect(result1.entity).toEqual(mockSupabaseResponse.data);
          |                              ^
      223 |       
      224 |       // Change the mock data - but this shouldn't affect the second call
      225 |       // because it should use the cached value

      at Object.<anonymous> (tests/resolver.test.ts:222:30)

---------------------------------------|---------|----------|---------|---------|-----------------------
File                                   | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s     
---------------------------------------|---------|----------|---------|---------|-----------------------
All files                              |    9.64 |     7.36 |    9.85 |    9.79 |                       
 opaque-urls-v01                       |    38.7 |       40 |      50 |   34.48 |                       
  utils.ts                             |    38.7 |       40 |      50 |   34.48 | 20-21,34-37,52-84     
 opaque-urls-v01/src                   |   12.73 |    12.65 |   15.38 |   12.83 |                       
  cli.ts                               |       0 |        0 |       0 |       0 | 10-247                
  collision.ts                         |       0 |        0 |       0 |       0 | 7-111                 
  generator.ts                         |       0 |        0 |       0 |       0 | 7-94                  
  index.ts                             |       0 |        0 |       0 |       0 | 8-262                 
  resolver.ts                          |      85 |    51.28 |     100 |      85 | 52,80,111,126,143,157 
 opaque-urls-v01/src/adapters          |       0 |      100 |       0 |       0 |                       
  index.ts                             |       0 |      100 |       0 |       0 | 8-12                  
 opaque-urls-v01/src/adapters/supabase |       0 |        0 |       0 |       0 |                       
  SupabaseAdapter.ts                   |       0 |        0 |       0 |       0 | 9-342                 
  errors.ts                            |       0 |        0 |       0 |       0 | 19-204                
  index.ts                             |       0 |      100 |       0 |       0 | 5-14                  
 opaque-urls-v01/src/core/storage      |       0 |      100 |       0 |       0 |                       
  StorageAdapter.ts                    |       0 |      100 |       0 |       0 | 10-60                 
  index.ts                             |       0 |      100 |       0 |       0 | 7                     
---------------------------------------|---------|----------|---------|---------|-----------------------
Jest: "global" coverage threshold for statements (80%) not met: 9.64%
Jest: "global" coverage threshold for branches (80%) not met: 7.36%
Jest: "global" coverage threshold for lines (80%) not met: 9.79%
Jest: "global" coverage threshold for functions (80%) not met: 9.85%
Test Suites: 2 failed, 2 total
Tests:       3 failed, 3 passed, 6 total
Snapshots:   0 total
Time:        3.017 s
Ran all test suites.
betatable@Mac opaque-urls-v01 % npm test

> longurl@0.1.0 test
> jest

 FAIL  tests/resolver.test.ts
  ● URL Resolver › resolveUrlId › should return error when URL ID not found

    expect(received).toBe(expected) // Object.is equality

    Expected: false
    Received: true

      173 |       );
      174 |       
    > 175 |       expect(result.success).toBe(false);
          |                              ^
      176 |       expect(result.error).toContain('No rows found');
      177 |       expect(result.entity).toBeUndefined();
      178 |     });

      at Object.<anonymous> (tests/resolver.test.ts:175:30)

  ● URL Resolver › resolveUrlId › should handle database errors gracefully

    expect(received).toBe(expected) // Object.is equality

    Expected: false
    Received: true

      195 |       );
      196 |       
    > 197 |       expect(result.success).toBe(false);
          |                              ^
      198 |       expect(result.error).toContain('Database connection error');
      199 |       expect(result.entity).toBeUndefined();
      200 |     });

      at Object.<anonymous> (tests/resolver.test.ts:197:30)

  ● URL Resolver › resolveUrlId › should use cached results when available

    expect(received).toEqual(expected) // deep equality

    - Expected  - 4
    + Received  + 3

      Object {
    -   "id": "insider-789",
    -   "insider_id": "insider-789",
    -   "name": "Jane Smith",
    -   "url_id": "Ef3G4h",
    +   "company_id": "company-456",
    +   "company_name": "Acme Corp",
    +   "ticker": "ACME",
      }

      221 |       
      222 |       expect(result1.success).toBe(true);
    > 223 |       expect(result1.entity).toEqual(mockSupabaseResponse.data);
          |                              ^
      224 |       
      225 |       // Change the mock data - but this shouldn't affect the second call
      226 |       // because it should use the cached value

      at Object.<anonymous> (tests/resolver.test.ts:223:30)

 FAIL  tests/generator.test.ts
  ● Console

    console.log
      Collision detected for company/rdO2lq, regenerating (attempt 1)...

      at log (src/generator.ts:50:15)

    console.log
      Collision detected for filing/Hm9FAc, regenerating (attempt 1)...

      at log (src/generator.ts:50:15)

    console.log
      Collision detected for filing/M9ebug, regenerating (attempt 2)...

      at log (src/generator.ts:50:15)

    console.log
      Collision detected for filing/pmmFsJ, regenerating (attempt 3)...

      at log (src/generator.ts:50:15)

    console.log
      Collision detected for filing/0jUmly, regenerating (attempt 4)...

      at log (src/generator.ts:50:15)

  ● URL Generator › generateUrlId › should generate a valid URL ID when there are no collisions

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    - Expected
    + Received

      "insider",
      "KcnOES",
      Object {
    -   "strategy": "INLINE",
    +   "connection": Object {
    +     "key": "",
    +     "url": "",
    +   },
    +   "lookupTable": "short_urls",
    +   "strategy": "LOOKUP_TABLE",
        "urlIdColumn": "url_id",
      },

    Number of calls: 1

      30 |       // Verify collision check was called
      31 |       expect(collision.checkCollision).toHaveBeenCalledTimes(1);
    > 32 |       expect(collision.checkCollision).toHaveBeenCalledWith(
         |                                        ^
      33 |         'insider',
      34 |         expect.any(String),
      35 |         { strategy: StorageStrategy.INLINE, urlIdColumn: 'url_id' }

      at Object.<anonymous> (tests/generator.test.ts:32:40)

  ● URL Generator › generateUrlId › should return an error after max collision attempts

    expect(jest.fn()).toHaveBeenCalledTimes(expected)

    Expected number of calls: 5
    Received number of calls: 4

      70 |       
      71 |       // Verify collision check was called 5 times (MAX_ATTEMPTS)
    > 72 |       expect(collision.checkCollision).toHaveBeenCalledTimes(5);
         |                                        ^
      73 |     });
      74 |     
      75 |     it('should respect custom ID length', async () => {

      at Object.<anonymous> (tests/generator.test.ts:72:40)

  ● URL Generator › generateUrlId › should handle errors gracefully

    expect(received).toContain(expected) // indexOf

    Expected substring: "Error generating opaque URL"
    Received string:    "Error generating URL: Database connection error"

      101 |       
      102 |       expect(result.success).toBe(false);
    > 103 |       expect(result.error).toContain('Error generating opaque URL');
          |                            ^
      104 |       expect(result.urlId).toBe('');
      105 |     });
      106 |   });

      at Object.<anonymous> (tests/generator.test.ts:103:28)

---------------------------------------|---------|----------|---------|---------|-----------------------
File                                   | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s     
---------------------------------------|---------|----------|---------|---------|-----------------------
All files                              |    15.3 |     9.63 |   15.49 |   15.81 |                       
 opaque-urls-v01                       |   51.61 |       40 |   83.33 |   48.27 |                       
  utils.ts                             |   51.61 |       40 |   83.33 |   48.27 | 52-84                 
 opaque-urls-v01/src                   |   21.34 |    17.72 |   23.07 |    21.5 |                       
  cli.ts                               |       0 |        0 |       0 |       0 | 10-247                
  collision.ts                         |       0 |        0 |       0 |       0 | 7-111                 
  generator.ts                         |     100 |    88.88 |     100 |     100 | 81                    
  index.ts                             |       0 |        0 |       0 |       0 | 8-262                 
  resolver.ts                          |      85 |    51.28 |     100 |      85 | 52,80,111,126,143,157 
 opaque-urls-v01/src/adapters          |       0 |      100 |       0 |       0 |                       
  index.ts                             |       0 |      100 |       0 |       0 | 8-12                  
 opaque-urls-v01/src/adapters/supabase |       0 |        0 |       0 |       0 |                       
  SupabaseAdapter.ts                   |       0 |        0 |       0 |       0 | 9-342                 
  errors.ts                            |       0 |        0 |       0 |       0 | 19-204                
  index.ts                             |       0 |      100 |       0 |       0 | 5-14                  
 opaque-urls-v01/src/core/storage      |       0 |      100 |       0 |       0 |                       
  StorageAdapter.ts                    |       0 |      100 |       0 |       0 | 10-60                 
  index.ts                             |       0 |      100 |       0 |       0 | 7                     
---------------------------------------|---------|----------|---------|---------|-----------------------
Jest: "global" coverage threshold for statements (80%) not met: 15.3%
Jest: "global" coverage threshold for branches (80%) not met: 9.63%
Jest: "global" coverage threshold for lines (80%) not met: 15.81%
Jest: "global" coverage threshold for functions (80%) not met: 15.49%
Test Suites: 2 failed, 2 total
Tests:       6 failed, 8 passed, 14 total
Snapshots:   0 total
Time:        2.664 s
Ran all test suites.
betatable@Mac opaque-urls-v01 % npm test

> longurl@0.1.0 test
> jest

 FAIL  tests/resolver.test.ts
  ● URL Resolver › resolveUrlId › should resolve a lookup table URL ID to its entity

    expect(received).toBe(expected) // Object.is equality

    Expected: true
    Received: false

      105 |       );
      106 |       
    > 107 |       expect(result.success).toBe(true);
          |                              ^
      108 |       expect(result.entity).toEqual(entityData);
      109 |       expect(result.entityId).toBe('company-456');
      110 |       expect(result.entityType).toBe('company');

      at Object.<anonymous> (tests/resolver.test.ts:107:30)

  ● URL Resolver › resolveUrlId › should return error when URL ID not found

    expect(received).toBe(expected) // Object.is equality

    Expected: false
    Received: true

      146 |       );
      147 |       
    > 148 |       expect(result.success).toBe(false);
          |                              ^
      149 |       expect(result.error).toContain('No rows found');
      150 |       expect(result.entity).toBeUndefined();
      151 |     });

      at Object.<anonymous> (tests/resolver.test.ts:148:30)

  ● URL Resolver › resolveUrlId › should handle database errors gracefully

    expect(received).toBe(expected) // Object.is equality

    Expected: false
    Received: true

      168 |       );
      169 |       
    > 170 |       expect(result.success).toBe(false);
          |                              ^
      171 |       expect(result.error).toContain('Database connection error');
      172 |       expect(result.entity).toBeUndefined();
      173 |     });

      at Object.<anonymous> (tests/resolver.test.ts:170:30)

 PASS  tests/generator.test.ts
  ● Console

    console.log
      Collision detected for company/M52wrC, regenerating (attempt 1)...

      at log (src/generator.ts:50:15)

    console.log
      Collision detected for filing/5vOt7E, regenerating (attempt 1)...

      at log (src/generator.ts:50:15)

    console.log
      Collision detected for filing/N4vXGx, regenerating (attempt 2)...

      at log (src/generator.ts:50:15)

    console.log
      Collision detected for filing/CeXsTu, regenerating (attempt 3)...

      at log (src/generator.ts:50:15)

    console.log
      Collision detected for filing/LzjOgg, regenerating (attempt 4)...

      at log (src/generator.ts:50:15)

---------------------------------------|---------|----------|---------|---------|--------------------
File                                   | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s  
---------------------------------------|---------|----------|---------|---------|--------------------
All files                              |   14.04 |     9.06 |   15.49 |   14.47 |                    
 opaque-urls-v01                       |   51.61 |       40 |   83.33 |   48.27 |                    
  utils.ts                             |   51.61 |       40 |   83.33 |   48.27 | 52-84              
 opaque-urls-v01/src                   |    19.1 |    16.45 |   23.07 |   19.24 |                    
  cli.ts                               |       0 |        0 |       0 |       0 | 10-247             
  collision.ts                         |       0 |        0 |       0 |       0 | 7-111              
  generator.ts                         |     100 |    88.88 |     100 |     100 | 81                 
  index.ts                             |       0 |        0 |       0 |       0 | 8-262              
  resolver.ts                          |      70 |    46.15 |     100 |      70 | 79-102,111,126,157 
 opaque-urls-v01/src/adapters          |       0 |      100 |       0 |       0 |                    
  index.ts                             |       0 |      100 |       0 |       0 | 8-12               
 opaque-urls-v01/src/adapters/supabase |       0 |        0 |       0 |       0 |                    
  SupabaseAdapter.ts                   |       0 |        0 |       0 |       0 | 9-342              
  errors.ts                            |       0 |        0 |       0 |       0 | 19-204             
  index.ts                             |       0 |      100 |       0 |       0 | 5-14               
 opaque-urls-v01/src/core/storage      |       0 |      100 |       0 |       0 |                    
  StorageAdapter.ts                    |       0 |      100 |       0 |       0 | 10-60              
  index.ts                             |       0 |      100 |       0 |       0 | 7                  
---------------------------------------|---------|----------|---------|---------|--------------------
Jest: "global" coverage threshold for statements (80%) not met: 14.04%
Jest: "global" coverage threshold for branches (80%) not met: 9.06%
Jest: "global" coverage threshold for lines (80%) not met: 14.47%
Jest: "global" coverage threshold for functions (80%) not met: 15.49%

Test Suites: 1 failed, 1 passed, 2 total
Tests:       3 failed, 11 passed, 14 total
Snapshots:   0 total
Time:        2.277 s
Ran all test suites.
betatable@Mac opaque-urls-v01 % npm test

> longurl@0.1.0 test
> jest

 FAIL  tests/resolver.test.ts
  ● Test suite failed to run

    tests/resolver.test.ts:6:7 - error TS7022: 'mockEq' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer.

    6 const mockEq = jest.fn(() => ({ eq: mockEq, single: mockSingle }));
            ~~~~~~
    tests/resolver.test.ts:6:24 - error TS7024: Function implicitly has return type 'any' because it does not have a return type annotation and is referenced directly or indirectly in one of its return expressions.

    6 const mockEq = jest.fn(() => ({ eq: mockEq, single: mockSingle }));
                             ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

 PASS  tests/generator.test.ts
  ● Console

    console.log
      Collision detected for company/djIAdZ, regenerating (attempt 1)...

      at log (src/generator.ts:50:15)

    console.log
      Collision detected for filing/VmTV8O, regenerating (attempt 1)...

      at log (src/generator.ts:50:15)

    console.log
      Collision detected for filing/GIZ1JK, regenerating (attempt 2)...

      at log (src/generator.ts:50:15)

    console.log
      Collision detected for filing/4gsKL6, regenerating (attempt 3)...

      at log (src/generator.ts:50:15)

    console.log
      Collision detected for filing/t2OMjb, regenerating (attempt 4)...

      at log (src/generator.ts:50:15)

---------------------------------------|---------|----------|---------|---------|-------------------
File                                   | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
---------------------------------------|---------|----------|---------|---------|-------------------
All files                              |    8.17 |     3.68 |    9.85 |    8.24 |                   
 opaque-urls-v01                       |   51.61 |    33.33 |   83.33 |   48.27 |                   
  utils.ts                             |   51.61 |    33.33 |   83.33 |   48.27 | 52-84             
 opaque-urls-v01/src                   |    8.61 |     5.06 |    7.69 |    8.67 |                   
  cli.ts                               |       0 |        0 |       0 |       0 | 10-247            
  collision.ts                         |       0 |        0 |       0 |       0 | 7-111             
  generator.ts                         |     100 |    88.88 |     100 |     100 | 81                
  index.ts                             |       0 |        0 |       0 |       0 | 8-262             
  resolver.ts                          |       0 |        0 |       0 |       0 | 7-161             
 opaque-urls-v01/src/adapters          |       0 |      100 |       0 |       0 |                   
  index.ts                             |       0 |      100 |       0 |       0 | 8-12              
 opaque-urls-v01/src/adapters/supabase |       0 |        0 |       0 |       0 |                   
  SupabaseAdapter.ts                   |       0 |        0 |       0 |       0 | 9-342             
  errors.ts                            |       0 |        0 |       0 |       0 | 19-204            
  index.ts                             |       0 |      100 |       0 |       0 | 5-14              
 opaque-urls-v01/src/core/storage      |       0 |      100 |       0 |       0 |                   
  StorageAdapter.ts                    |       0 |      100 |       0 |       0 | 10-60             
  index.ts                             |       0 |      100 |       0 |       0 | 7                 
---------------------------------------|---------|----------|---------|---------|-------------------
Jest: "global" coverage threshold for statements (80%) not met: 8.17%
Jest: "global" coverage threshold for branches (80%) not met: 3.68%
Jest: "global" coverage threshold for lines (80%) not met: 8.24%
Jest: "global" coverage threshold for functions (80%) not met: 9.85%

Test Suites: 1 failed, 1 passed, 2 total
Tests:       8 passed, 8 total
Snapshots:   0 total
Time:        2.153 s
Ran all test suites.
betatable@Mac opaque-urls-v01 % npm test

> longurl@0.1.0 test
> jest

 PASS  tests/generator.test.ts
  ● Console

    console.log
      Collision detected for company/u79vkG, regenerating (attempt 1)...

      at log (src/generator.ts:50:15)

    console.log
      Collision detected for filing/gKIdJw, regenerating (attempt 1)...

      at log (src/generator.ts:50:15)

    console.log
      Collision detected for filing/xVJyoc, regenerating (attempt 2)...

      at log (src/generator.ts:50:15)

    console.log
      Collision detected for filing/dK9LE9, regenerating (attempt 3)...

      at log (src/generator.ts:50:15)

    console.log
      Collision detected for filing/zl0xv9, regenerating (attempt 4)...

      at log (src/generator.ts:50:15)

 PASS  tests/resolver.test.ts
---------------------------------------|---------|----------|---------|---------|-------------------
File                                   | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
---------------------------------------|---------|----------|---------|---------|-------------------
All files                              |   15.72 |    11.61 |   15.49 |   16.25 |                   
 opaque-urls-v01                       |   51.61 |       40 |   83.33 |   48.27 |                   
  utils.ts                             |   51.61 |       40 |   83.33 |   48.27 | 52-84             
 opaque-urls-v01/src                   |   22.09 |    22.15 |   23.07 |   22.26 |                   
  cli.ts                               |       0 |        0 |       0 |       0 | 10-247            
  collision.ts                         |       0 |        0 |       0 |       0 | 7-111             
  generator.ts                         |     100 |    88.88 |     100 |     100 | 81                
  index.ts                             |       0 |        0 |       0 |       0 | 8-262             
  resolver.ts                          |      90 |    69.23 |     100 |      90 | 80,111,143,157    
 opaque-urls-v01/src/adapters          |       0 |      100 |       0 |       0 |                   
  index.ts                             |       0 |      100 |       0 |       0 | 8-12              
 opaque-urls-v01/src/adapters/supabase |       0 |        0 |       0 |       0 |                   
  SupabaseAdapter.ts                   |       0 |        0 |       0 |       0 | 9-342             
  errors.ts                            |       0 |        0 |       0 |       0 | 19-204            
  index.ts                             |       0 |      100 |       0 |       0 | 5-14              
 opaque-urls-v01/src/core/storage      |       0 |      100 |       0 |       0 |                   
  StorageAdapter.ts                    |       0 |      100 |       0 |       0 | 10-60             
  index.ts                             |       0 |      100 |       0 |       0 | 7                 
---------------------------------------|---------|----------|---------|---------|-------------------
Jest: "global" coverage threshold for statements (80%) not met: 15.72%
Jest: "global" coverage threshold for branches (80%) not met: 11.61%
Jest: "global" coverage threshold for lines (80%) not met: 16.25%
Jest: "global" coverage threshold for functions (80%) not met: 15.49%

Test Suites: 2 passed, 2 total
Tests:       14 passed, 14 total
Snapshots:   0 total
Time:        2.132 s
Ran all test suites.
betatable@Mac opaque-urls-v01 % 