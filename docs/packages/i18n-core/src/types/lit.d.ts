/**
 * file lit.d.ts
 * description @yyc3/i18n-core types/lit.d.ts 模块
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 2.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/i18n-core types/lit.d.ts 模块
 */
declare module 'lit' {
    export interface ReactiveControllerHost {
        addController(controller: unknown): void;
        requestUpdate(): void;
    }

    export interface ReactiveController {
        hostConnected?(): void;
        hostDisconnected?(): void;
    }
}
