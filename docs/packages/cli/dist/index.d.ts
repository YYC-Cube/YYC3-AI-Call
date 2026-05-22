#!/usr/bin/env node
import { Command } from 'commander';
import { z } from 'zod';

declare const configSchema: z.ZodObject<{
    $schema: z.ZodOptional<z.ZodString>;
    style: z.ZodString;
    rsc: z.ZodDefault<z.ZodBoolean>;
    tsx: z.ZodDefault<z.ZodBoolean>;
    tailwind: z.ZodObject<{
        config: z.ZodOptional<z.ZodString>;
        css: z.ZodString;
        baseColor: z.ZodString;
        cssVariables: z.ZodDefault<z.ZodBoolean>;
        prefix: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        css: string;
        baseColor: string;
        cssVariables: boolean;
        config?: string | undefined;
        prefix?: string | undefined;
    }, {
        css: string;
        baseColor: string;
        config?: string | undefined;
        cssVariables?: boolean | undefined;
        prefix?: string | undefined;
    }>;
    iconLibrary: z.ZodOptional<z.ZodString>;
    rtl: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    menuColor: z.ZodOptional<z.ZodDefault<z.ZodEnum<["default", "inverted", "default-translucent", "inverted-translucent"]>>>;
    menuAccent: z.ZodOptional<z.ZodDefault<z.ZodEnum<["subtle", "bold"]>>>;
    aliases: z.ZodObject<{
        components: z.ZodString;
        utils: z.ZodString;
        ui: z.ZodOptional<z.ZodString>;
        lib: z.ZodOptional<z.ZodString>;
        hooks: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        components: string;
        utils: string;
        ui?: string | undefined;
        lib?: string | undefined;
        hooks?: string | undefined;
    }, {
        components: string;
        utils: string;
        ui?: string | undefined;
        lib?: string | undefined;
        hooks?: string | undefined;
    }>;
    registries: z.ZodOptional<z.ZodRecord<z.ZodEffects<z.ZodString, string, string>, z.ZodUnion<[z.ZodEffects<z.ZodString, string, string>, z.ZodObject<{
        url: z.ZodEffects<z.ZodString, string, string>;
        params: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        url: string;
        params?: Record<string, string> | undefined;
        headers?: Record<string, string> | undefined;
    }, {
        url: string;
        params?: Record<string, string> | undefined;
        headers?: Record<string, string> | undefined;
    }>]>>>;
} & {
    resolvedPaths: z.ZodObject<{
        cwd: z.ZodString;
        tailwindConfig: z.ZodString;
        tailwindCss: z.ZodString;
        utils: z.ZodString;
        components: z.ZodString;
        lib: z.ZodString;
        hooks: z.ZodString;
        ui: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        ui: string;
        components: string;
        cwd: string;
        utils: string;
        lib: string;
        hooks: string;
        tailwindConfig: string;
        tailwindCss: string;
    }, {
        ui: string;
        components: string;
        cwd: string;
        utils: string;
        lib: string;
        hooks: string;
        tailwindConfig: string;
        tailwindCss: string;
    }>;
}, "strict", z.ZodTypeAny, {
    tailwind: {
        css: string;
        baseColor: string;
        cssVariables: boolean;
        config?: string | undefined;
        prefix?: string | undefined;
    };
    style: string;
    rsc: boolean;
    tsx: boolean;
    aliases: {
        components: string;
        utils: string;
        ui?: string | undefined;
        lib?: string | undefined;
        hooks?: string | undefined;
    };
    resolvedPaths: {
        ui: string;
        components: string;
        cwd: string;
        utils: string;
        lib: string;
        hooks: string;
        tailwindConfig: string;
        tailwindCss: string;
    };
    $schema?: string | undefined;
    iconLibrary?: string | undefined;
    rtl?: boolean | undefined;
    menuColor?: "default" | "inverted" | "default-translucent" | "inverted-translucent" | undefined;
    menuAccent?: "bold" | "subtle" | undefined;
    registries?: Record<string, string | {
        url: string;
        params?: Record<string, string> | undefined;
        headers?: Record<string, string> | undefined;
    }> | undefined;
}, {
    tailwind: {
        css: string;
        baseColor: string;
        config?: string | undefined;
        cssVariables?: boolean | undefined;
        prefix?: string | undefined;
    };
    style: string;
    aliases: {
        components: string;
        utils: string;
        ui?: string | undefined;
        lib?: string | undefined;
        hooks?: string | undefined;
    };
    resolvedPaths: {
        ui: string;
        components: string;
        cwd: string;
        utils: string;
        lib: string;
        hooks: string;
        tailwindConfig: string;
        tailwindCss: string;
    };
    $schema?: string | undefined;
    rsc?: boolean | undefined;
    tsx?: boolean | undefined;
    iconLibrary?: string | undefined;
    rtl?: boolean | undefined;
    menuColor?: "default" | "inverted" | "default-translucent" | "inverted-translucent" | undefined;
    menuAccent?: "bold" | "subtle" | undefined;
    registries?: Record<string, string | {
        url: string;
        params?: Record<string, string> | undefined;
        headers?: Record<string, string> | undefined;
    }> | undefined;
}>;
declare const registryItemSchema: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
    $schema: z.ZodOptional<z.ZodString>;
    extends: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
    author: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    dependencies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    devDependencies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    registryDependencies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    files: z.ZodOptional<z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
        path: z.ZodString;
        content: z.ZodOptional<z.ZodString>;
        type: z.ZodEnum<["registry:file", "registry:page"]>;
        target: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        path: string;
        type: "registry:page" | "registry:file";
        target: string;
        content?: string | undefined;
    }, {
        path: string;
        type: "registry:page" | "registry:file";
        target: string;
        content?: string | undefined;
    }>, z.ZodObject<{
        path: z.ZodString;
        content: z.ZodOptional<z.ZodString>;
        type: z.ZodEnum<["registry:lib", "registry:block", "registry:component", "registry:ui", "registry:hook", "registry:theme", "registry:style", "registry:item", "registry:base", "registry:font", "registry:example", "registry:internal"]>;
        target: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        path: string;
        type: "registry:lib" | "registry:block" | "registry:component" | "registry:ui" | "registry:hook" | "registry:theme" | "registry:style" | "registry:item" | "registry:base" | "registry:font" | "registry:example" | "registry:internal";
        content?: string | undefined;
        target?: string | undefined;
    }, {
        path: string;
        type: "registry:lib" | "registry:block" | "registry:component" | "registry:ui" | "registry:hook" | "registry:theme" | "registry:style" | "registry:item" | "registry:base" | "registry:font" | "registry:example" | "registry:internal";
        content?: string | undefined;
        target?: string | undefined;
    }>]>, "many">>;
    tailwind: z.ZodOptional<z.ZodObject<{
        config: z.ZodOptional<z.ZodObject<{
            content: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            theme: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            plugins: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            content?: string[] | undefined;
            theme?: Record<string, any> | undefined;
            plugins?: string[] | undefined;
        }, {
            content?: string[] | undefined;
            theme?: Record<string, any> | undefined;
            plugins?: string[] | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        config?: {
            content?: string[] | undefined;
            theme?: Record<string, any> | undefined;
            plugins?: string[] | undefined;
        } | undefined;
    }, {
        config?: {
            content?: string[] | undefined;
            theme?: Record<string, any> | undefined;
            plugins?: string[] | undefined;
        } | undefined;
    }>>;
    cssVars: z.ZodOptional<z.ZodObject<{
        theme: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        light: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        dark: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        theme?: Record<string, string> | undefined;
        light?: Record<string, string> | undefined;
        dark?: Record<string, string> | undefined;
    }, {
        theme?: Record<string, string> | undefined;
        light?: Record<string, string> | undefined;
        dark?: Record<string, string> | undefined;
    }>>;
    css: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodType<any, z.ZodTypeDef, any>>>;
    envVars: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    docs: z.ZodOptional<z.ZodString>;
    categories: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
} & {
    type: z.ZodLiteral<"registry:base">;
    config: z.ZodOptional<z.ZodObject<{
        $schema: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        style: z.ZodOptional<z.ZodString>;
        rsc: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
        tsx: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
        tailwind: z.ZodOptional<z.ZodObject<{
            config: z.ZodOptional<z.ZodOptional<z.ZodString>>;
            css: z.ZodOptional<z.ZodString>;
            baseColor: z.ZodOptional<z.ZodString>;
            cssVariables: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
            prefix: z.ZodOptional<z.ZodOptional<z.ZodDefault<z.ZodString>>>;
        }, "strip", z.ZodTypeAny, {
            config?: string | undefined;
            css?: string | undefined;
            baseColor?: string | undefined;
            cssVariables?: boolean | undefined;
            prefix?: string | undefined;
        }, {
            config?: string | undefined;
            css?: string | undefined;
            baseColor?: string | undefined;
            cssVariables?: boolean | undefined;
            prefix?: string | undefined;
        }>>;
        iconLibrary: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        rtl: z.ZodOptional<z.ZodOptional<z.ZodDefault<z.ZodBoolean>>>;
        menuColor: z.ZodOptional<z.ZodOptional<z.ZodDefault<z.ZodEnum<["default", "inverted", "default-translucent", "inverted-translucent"]>>>>;
        menuAccent: z.ZodOptional<z.ZodOptional<z.ZodDefault<z.ZodEnum<["subtle", "bold"]>>>>;
        aliases: z.ZodOptional<z.ZodObject<{
            components: z.ZodOptional<z.ZodString>;
            utils: z.ZodOptional<z.ZodString>;
            ui: z.ZodOptional<z.ZodOptional<z.ZodString>>;
            lib: z.ZodOptional<z.ZodOptional<z.ZodString>>;
            hooks: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            ui?: string | undefined;
            components?: string | undefined;
            utils?: string | undefined;
            lib?: string | undefined;
            hooks?: string | undefined;
        }, {
            ui?: string | undefined;
            components?: string | undefined;
            utils?: string | undefined;
            lib?: string | undefined;
            hooks?: string | undefined;
        }>>;
        registries: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodEffects<z.ZodString, string, string>, z.ZodUnion<[z.ZodEffects<z.ZodString, string, string>, z.ZodObject<{
            url: z.ZodEffects<z.ZodString, string, string>;
            params: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            url: string;
            params?: Record<string, string> | undefined;
            headers?: Record<string, string> | undefined;
        }, {
            url: string;
            params?: Record<string, string> | undefined;
            headers?: Record<string, string> | undefined;
        }>]>>>>;
    }, "strict", z.ZodTypeAny, {
        tailwind?: {
            config?: string | undefined;
            css?: string | undefined;
            baseColor?: string | undefined;
            cssVariables?: boolean | undefined;
            prefix?: string | undefined;
        } | undefined;
        $schema?: string | undefined;
        style?: string | undefined;
        rsc?: boolean | undefined;
        tsx?: boolean | undefined;
        iconLibrary?: string | undefined;
        rtl?: boolean | undefined;
        menuColor?: "default" | "inverted" | "default-translucent" | "inverted-translucent" | undefined;
        menuAccent?: "bold" | "subtle" | undefined;
        aliases?: {
            ui?: string | undefined;
            components?: string | undefined;
            utils?: string | undefined;
            lib?: string | undefined;
            hooks?: string | undefined;
        } | undefined;
        registries?: Record<string, string | {
            url: string;
            params?: Record<string, string> | undefined;
            headers?: Record<string, string> | undefined;
        }> | undefined;
    }, {
        tailwind?: {
            config?: string | undefined;
            css?: string | undefined;
            baseColor?: string | undefined;
            cssVariables?: boolean | undefined;
            prefix?: string | undefined;
        } | undefined;
        $schema?: string | undefined;
        style?: string | undefined;
        rsc?: boolean | undefined;
        tsx?: boolean | undefined;
        iconLibrary?: string | undefined;
        rtl?: boolean | undefined;
        menuColor?: "default" | "inverted" | "default-translucent" | "inverted-translucent" | undefined;
        menuAccent?: "bold" | "subtle" | undefined;
        aliases?: {
            ui?: string | undefined;
            components?: string | undefined;
            utils?: string | undefined;
            lib?: string | undefined;
            hooks?: string | undefined;
        } | undefined;
        registries?: Record<string, string | {
            url: string;
            params?: Record<string, string> | undefined;
            headers?: Record<string, string> | undefined;
        }> | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    type: "registry:base";
    name: string;
    tailwind?: {
        config?: {
            content?: string[] | undefined;
            theme?: Record<string, any> | undefined;
            plugins?: string[] | undefined;
        } | undefined;
    } | undefined;
    docs?: string | undefined;
    $schema?: string | undefined;
    config?: {
        tailwind?: {
            config?: string | undefined;
            css?: string | undefined;
            baseColor?: string | undefined;
            cssVariables?: boolean | undefined;
            prefix?: string | undefined;
        } | undefined;
        $schema?: string | undefined;
        style?: string | undefined;
        rsc?: boolean | undefined;
        tsx?: boolean | undefined;
        iconLibrary?: string | undefined;
        rtl?: boolean | undefined;
        menuColor?: "default" | "inverted" | "default-translucent" | "inverted-translucent" | undefined;
        menuAccent?: "bold" | "subtle" | undefined;
        aliases?: {
            ui?: string | undefined;
            components?: string | undefined;
            utils?: string | undefined;
            lib?: string | undefined;
            hooks?: string | undefined;
        } | undefined;
        registries?: Record<string, string | {
            url: string;
            params?: Record<string, string> | undefined;
            headers?: Record<string, string> | undefined;
        }> | undefined;
    } | undefined;
    css?: Record<string, any> | undefined;
    extends?: string | undefined;
    title?: string | undefined;
    author?: string | undefined;
    description?: string | undefined;
    dependencies?: string[] | undefined;
    devDependencies?: string[] | undefined;
    registryDependencies?: string[] | undefined;
    files?: ({
        path: string;
        type: "registry:page" | "registry:file";
        target: string;
        content?: string | undefined;
    } | {
        path: string;
        type: "registry:lib" | "registry:block" | "registry:component" | "registry:ui" | "registry:hook" | "registry:theme" | "registry:style" | "registry:item" | "registry:base" | "registry:font" | "registry:example" | "registry:internal";
        content?: string | undefined;
        target?: string | undefined;
    })[] | undefined;
    cssVars?: {
        theme?: Record<string, string> | undefined;
        light?: Record<string, string> | undefined;
        dark?: Record<string, string> | undefined;
    } | undefined;
    envVars?: Record<string, string> | undefined;
    meta?: Record<string, any> | undefined;
    categories?: string[] | undefined;
}, {
    type: "registry:base";
    name: string;
    tailwind?: {
        config?: {
            content?: string[] | undefined;
            theme?: Record<string, any> | undefined;
            plugins?: string[] | undefined;
        } | undefined;
    } | undefined;
    docs?: string | undefined;
    $schema?: string | undefined;
    config?: {
        tailwind?: {
            config?: string | undefined;
            css?: string | undefined;
            baseColor?: string | undefined;
            cssVariables?: boolean | undefined;
            prefix?: string | undefined;
        } | undefined;
        $schema?: string | undefined;
        style?: string | undefined;
        rsc?: boolean | undefined;
        tsx?: boolean | undefined;
        iconLibrary?: string | undefined;
        rtl?: boolean | undefined;
        menuColor?: "default" | "inverted" | "default-translucent" | "inverted-translucent" | undefined;
        menuAccent?: "bold" | "subtle" | undefined;
        aliases?: {
            ui?: string | undefined;
            components?: string | undefined;
            utils?: string | undefined;
            lib?: string | undefined;
            hooks?: string | undefined;
        } | undefined;
        registries?: Record<string, string | {
            url: string;
            params?: Record<string, string> | undefined;
            headers?: Record<string, string> | undefined;
        }> | undefined;
    } | undefined;
    css?: Record<string, any> | undefined;
    extends?: string | undefined;
    title?: string | undefined;
    author?: string | undefined;
    description?: string | undefined;
    dependencies?: string[] | undefined;
    devDependencies?: string[] | undefined;
    registryDependencies?: string[] | undefined;
    files?: ({
        path: string;
        type: "registry:page" | "registry:file";
        target: string;
        content?: string | undefined;
    } | {
        path: string;
        type: "registry:lib" | "registry:block" | "registry:component" | "registry:ui" | "registry:hook" | "registry:theme" | "registry:style" | "registry:item" | "registry:base" | "registry:font" | "registry:example" | "registry:internal";
        content?: string | undefined;
        target?: string | undefined;
    })[] | undefined;
    cssVars?: {
        theme?: Record<string, string> | undefined;
        light?: Record<string, string> | undefined;
        dark?: Record<string, string> | undefined;
    } | undefined;
    envVars?: Record<string, string> | undefined;
    meta?: Record<string, any> | undefined;
    categories?: string[] | undefined;
}>, z.ZodObject<{
    $schema: z.ZodOptional<z.ZodString>;
    extends: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
    author: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    dependencies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    devDependencies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    registryDependencies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    files: z.ZodOptional<z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
        path: z.ZodString;
        content: z.ZodOptional<z.ZodString>;
        type: z.ZodEnum<["registry:file", "registry:page"]>;
        target: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        path: string;
        type: "registry:page" | "registry:file";
        target: string;
        content?: string | undefined;
    }, {
        path: string;
        type: "registry:page" | "registry:file";
        target: string;
        content?: string | undefined;
    }>, z.ZodObject<{
        path: z.ZodString;
        content: z.ZodOptional<z.ZodString>;
        type: z.ZodEnum<["registry:lib", "registry:block", "registry:component", "registry:ui", "registry:hook", "registry:theme", "registry:style", "registry:item", "registry:base", "registry:font", "registry:example", "registry:internal"]>;
        target: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        path: string;
        type: "registry:lib" | "registry:block" | "registry:component" | "registry:ui" | "registry:hook" | "registry:theme" | "registry:style" | "registry:item" | "registry:base" | "registry:font" | "registry:example" | "registry:internal";
        content?: string | undefined;
        target?: string | undefined;
    }, {
        path: string;
        type: "registry:lib" | "registry:block" | "registry:component" | "registry:ui" | "registry:hook" | "registry:theme" | "registry:style" | "registry:item" | "registry:base" | "registry:font" | "registry:example" | "registry:internal";
        content?: string | undefined;
        target?: string | undefined;
    }>]>, "many">>;
    tailwind: z.ZodOptional<z.ZodObject<{
        config: z.ZodOptional<z.ZodObject<{
            content: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            theme: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            plugins: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            content?: string[] | undefined;
            theme?: Record<string, any> | undefined;
            plugins?: string[] | undefined;
        }, {
            content?: string[] | undefined;
            theme?: Record<string, any> | undefined;
            plugins?: string[] | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        config?: {
            content?: string[] | undefined;
            theme?: Record<string, any> | undefined;
            plugins?: string[] | undefined;
        } | undefined;
    }, {
        config?: {
            content?: string[] | undefined;
            theme?: Record<string, any> | undefined;
            plugins?: string[] | undefined;
        } | undefined;
    }>>;
    cssVars: z.ZodOptional<z.ZodObject<{
        theme: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        light: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        dark: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        theme?: Record<string, string> | undefined;
        light?: Record<string, string> | undefined;
        dark?: Record<string, string> | undefined;
    }, {
        theme?: Record<string, string> | undefined;
        light?: Record<string, string> | undefined;
        dark?: Record<string, string> | undefined;
    }>>;
    css: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodType<any, z.ZodTypeDef, any>>>;
    envVars: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    docs: z.ZodOptional<z.ZodString>;
    categories: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
} & {
    type: z.ZodLiteral<"registry:font">;
    font: z.ZodObject<{
        family: z.ZodString;
        provider: z.ZodLiteral<"google">;
        import: z.ZodString;
        variable: z.ZodString;
        weight: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        subsets: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        selector: z.ZodOptional<z.ZodString>;
        dependency: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        family: string;
        provider: "google";
        import: string;
        variable: string;
        weight?: string[] | undefined;
        subsets?: string[] | undefined;
        selector?: string | undefined;
        dependency?: string | undefined;
    }, {
        family: string;
        provider: "google";
        import: string;
        variable: string;
        weight?: string[] | undefined;
        subsets?: string[] | undefined;
        selector?: string | undefined;
        dependency?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "registry:font";
    name: string;
    font: {
        family: string;
        provider: "google";
        import: string;
        variable: string;
        weight?: string[] | undefined;
        subsets?: string[] | undefined;
        selector?: string | undefined;
        dependency?: string | undefined;
    };
    tailwind?: {
        config?: {
            content?: string[] | undefined;
            theme?: Record<string, any> | undefined;
            plugins?: string[] | undefined;
        } | undefined;
    } | undefined;
    docs?: string | undefined;
    $schema?: string | undefined;
    css?: Record<string, any> | undefined;
    extends?: string | undefined;
    title?: string | undefined;
    author?: string | undefined;
    description?: string | undefined;
    dependencies?: string[] | undefined;
    devDependencies?: string[] | undefined;
    registryDependencies?: string[] | undefined;
    files?: ({
        path: string;
        type: "registry:page" | "registry:file";
        target: string;
        content?: string | undefined;
    } | {
        path: string;
        type: "registry:lib" | "registry:block" | "registry:component" | "registry:ui" | "registry:hook" | "registry:theme" | "registry:style" | "registry:item" | "registry:base" | "registry:font" | "registry:example" | "registry:internal";
        content?: string | undefined;
        target?: string | undefined;
    })[] | undefined;
    cssVars?: {
        theme?: Record<string, string> | undefined;
        light?: Record<string, string> | undefined;
        dark?: Record<string, string> | undefined;
    } | undefined;
    envVars?: Record<string, string> | undefined;
    meta?: Record<string, any> | undefined;
    categories?: string[] | undefined;
}, {
    type: "registry:font";
    name: string;
    font: {
        family: string;
        provider: "google";
        import: string;
        variable: string;
        weight?: string[] | undefined;
        subsets?: string[] | undefined;
        selector?: string | undefined;
        dependency?: string | undefined;
    };
    tailwind?: {
        config?: {
            content?: string[] | undefined;
            theme?: Record<string, any> | undefined;
            plugins?: string[] | undefined;
        } | undefined;
    } | undefined;
    docs?: string | undefined;
    $schema?: string | undefined;
    css?: Record<string, any> | undefined;
    extends?: string | undefined;
    title?: string | undefined;
    author?: string | undefined;
    description?: string | undefined;
    dependencies?: string[] | undefined;
    devDependencies?: string[] | undefined;
    registryDependencies?: string[] | undefined;
    files?: ({
        path: string;
        type: "registry:page" | "registry:file";
        target: string;
        content?: string | undefined;
    } | {
        path: string;
        type: "registry:lib" | "registry:block" | "registry:component" | "registry:ui" | "registry:hook" | "registry:theme" | "registry:style" | "registry:item" | "registry:base" | "registry:font" | "registry:example" | "registry:internal";
        content?: string | undefined;
        target?: string | undefined;
    })[] | undefined;
    cssVars?: {
        theme?: Record<string, string> | undefined;
        light?: Record<string, string> | undefined;
        dark?: Record<string, string> | undefined;
    } | undefined;
    envVars?: Record<string, string> | undefined;
    meta?: Record<string, any> | undefined;
    categories?: string[] | undefined;
}>, z.ZodObject<{
    $schema: z.ZodOptional<z.ZodString>;
    extends: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
    author: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    dependencies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    devDependencies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    registryDependencies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    files: z.ZodOptional<z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
        path: z.ZodString;
        content: z.ZodOptional<z.ZodString>;
        type: z.ZodEnum<["registry:file", "registry:page"]>;
        target: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        path: string;
        type: "registry:page" | "registry:file";
        target: string;
        content?: string | undefined;
    }, {
        path: string;
        type: "registry:page" | "registry:file";
        target: string;
        content?: string | undefined;
    }>, z.ZodObject<{
        path: z.ZodString;
        content: z.ZodOptional<z.ZodString>;
        type: z.ZodEnum<["registry:lib", "registry:block", "registry:component", "registry:ui", "registry:hook", "registry:theme", "registry:style", "registry:item", "registry:base", "registry:font", "registry:example", "registry:internal"]>;
        target: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        path: string;
        type: "registry:lib" | "registry:block" | "registry:component" | "registry:ui" | "registry:hook" | "registry:theme" | "registry:style" | "registry:item" | "registry:base" | "registry:font" | "registry:example" | "registry:internal";
        content?: string | undefined;
        target?: string | undefined;
    }, {
        path: string;
        type: "registry:lib" | "registry:block" | "registry:component" | "registry:ui" | "registry:hook" | "registry:theme" | "registry:style" | "registry:item" | "registry:base" | "registry:font" | "registry:example" | "registry:internal";
        content?: string | undefined;
        target?: string | undefined;
    }>]>, "many">>;
    tailwind: z.ZodOptional<z.ZodObject<{
        config: z.ZodOptional<z.ZodObject<{
            content: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            theme: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            plugins: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            content?: string[] | undefined;
            theme?: Record<string, any> | undefined;
            plugins?: string[] | undefined;
        }, {
            content?: string[] | undefined;
            theme?: Record<string, any> | undefined;
            plugins?: string[] | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        config?: {
            content?: string[] | undefined;
            theme?: Record<string, any> | undefined;
            plugins?: string[] | undefined;
        } | undefined;
    }, {
        config?: {
            content?: string[] | undefined;
            theme?: Record<string, any> | undefined;
            plugins?: string[] | undefined;
        } | undefined;
    }>>;
    cssVars: z.ZodOptional<z.ZodObject<{
        theme: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        light: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        dark: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        theme?: Record<string, string> | undefined;
        light?: Record<string, string> | undefined;
        dark?: Record<string, string> | undefined;
    }, {
        theme?: Record<string, string> | undefined;
        light?: Record<string, string> | undefined;
        dark?: Record<string, string> | undefined;
    }>>;
    css: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodType<any, z.ZodTypeDef, any>>>;
    envVars: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    docs: z.ZodOptional<z.ZodString>;
    categories: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
} & {
    type: z.ZodEnum<["registry:lib", "registry:block", "registry:component", "registry:ui", "registry:hook", "registry:page", "registry:file", "registry:theme", "registry:style", "registry:item", "registry:example", "registry:internal"]>;
}, "strip", z.ZodTypeAny, {
    type: "registry:lib" | "registry:block" | "registry:component" | "registry:ui" | "registry:hook" | "registry:page" | "registry:file" | "registry:theme" | "registry:style" | "registry:item" | "registry:example" | "registry:internal";
    name: string;
    tailwind?: {
        config?: {
            content?: string[] | undefined;
            theme?: Record<string, any> | undefined;
            plugins?: string[] | undefined;
        } | undefined;
    } | undefined;
    docs?: string | undefined;
    $schema?: string | undefined;
    css?: Record<string, any> | undefined;
    extends?: string | undefined;
    title?: string | undefined;
    author?: string | undefined;
    description?: string | undefined;
    dependencies?: string[] | undefined;
    devDependencies?: string[] | undefined;
    registryDependencies?: string[] | undefined;
    files?: ({
        path: string;
        type: "registry:page" | "registry:file";
        target: string;
        content?: string | undefined;
    } | {
        path: string;
        type: "registry:lib" | "registry:block" | "registry:component" | "registry:ui" | "registry:hook" | "registry:theme" | "registry:style" | "registry:item" | "registry:base" | "registry:font" | "registry:example" | "registry:internal";
        content?: string | undefined;
        target?: string | undefined;
    })[] | undefined;
    cssVars?: {
        theme?: Record<string, string> | undefined;
        light?: Record<string, string> | undefined;
        dark?: Record<string, string> | undefined;
    } | undefined;
    envVars?: Record<string, string> | undefined;
    meta?: Record<string, any> | undefined;
    categories?: string[] | undefined;
}, {
    type: "registry:lib" | "registry:block" | "registry:component" | "registry:ui" | "registry:hook" | "registry:page" | "registry:file" | "registry:theme" | "registry:style" | "registry:item" | "registry:example" | "registry:internal";
    name: string;
    tailwind?: {
        config?: {
            content?: string[] | undefined;
            theme?: Record<string, any> | undefined;
            plugins?: string[] | undefined;
        } | undefined;
    } | undefined;
    docs?: string | undefined;
    $schema?: string | undefined;
    css?: Record<string, any> | undefined;
    extends?: string | undefined;
    title?: string | undefined;
    author?: string | undefined;
    description?: string | undefined;
    dependencies?: string[] | undefined;
    devDependencies?: string[] | undefined;
    registryDependencies?: string[] | undefined;
    files?: ({
        path: string;
        type: "registry:page" | "registry:file";
        target: string;
        content?: string | undefined;
    } | {
        path: string;
        type: "registry:lib" | "registry:block" | "registry:component" | "registry:ui" | "registry:hook" | "registry:theme" | "registry:style" | "registry:item" | "registry:base" | "registry:font" | "registry:example" | "registry:internal";
        content?: string | undefined;
        target?: string | undefined;
    })[] | undefined;
    cssVars?: {
        theme?: Record<string, string> | undefined;
        light?: Record<string, string> | undefined;
        dark?: Record<string, string> | undefined;
    } | undefined;
    envVars?: Record<string, string> | undefined;
    meta?: Record<string, any> | undefined;
    categories?: string[] | undefined;
}>]>;
declare const registryIndexSchema: z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
    $schema: z.ZodOptional<z.ZodString>;
    extends: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
    author: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    dependencies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    devDependencies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    registryDependencies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    files: z.ZodOptional<z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
        path: z.ZodString;
        content: z.ZodOptional<z.ZodString>;
        type: z.ZodEnum<["registry:file", "registry:page"]>;
        target: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        path: string;
        type: "registry:page" | "registry:file";
        target: string;
        content?: string | undefined;
    }, {
        path: string;
        type: "registry:page" | "registry:file";
        target: string;
        content?: string | undefined;
    }>, z.ZodObject<{
        path: z.ZodString;
        content: z.ZodOptional<z.ZodString>;
        type: z.ZodEnum<["registry:lib", "registry:block", "registry:component", "registry:ui", "registry:hook", "registry:theme", "registry:style", "registry:item", "registry:base", "registry:font", "registry:example", "registry:internal"]>;
        target: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        path: string;
        type: "registry:lib" | "registry:block" | "registry:component" | "registry:ui" | "registry:hook" | "registry:theme" | "registry:style" | "registry:item" | "registry:base" | "registry:font" | "registry:example" | "registry:internal";
        content?: string | undefined;
        target?: string | undefined;
    }, {
        path: string;
        type: "registry:lib" | "registry:block" | "registry:component" | "registry:ui" | "registry:hook" | "registry:theme" | "registry:style" | "registry:item" | "registry:base" | "registry:font" | "registry:example" | "registry:internal";
        content?: string | undefined;
        target?: string | undefined;
    }>]>, "many">>;
    tailwind: z.ZodOptional<z.ZodObject<{
        config: z.ZodOptional<z.ZodObject<{
            content: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            theme: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            plugins: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            content?: string[] | undefined;
            theme?: Record<string, any> | undefined;
            plugins?: string[] | undefined;
        }, {
            content?: string[] | undefined;
            theme?: Record<string, any> | undefined;
            plugins?: string[] | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        config?: {
            content?: string[] | undefined;
            theme?: Record<string, any> | undefined;
            plugins?: string[] | undefined;
        } | undefined;
    }, {
        config?: {
            content?: string[] | undefined;
            theme?: Record<string, any> | undefined;
            plugins?: string[] | undefined;
        } | undefined;
    }>>;
    cssVars: z.ZodOptional<z.ZodObject<{
        theme: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        light: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        dark: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        theme?: Record<string, string> | undefined;
        light?: Record<string, string> | undefined;
        dark?: Record<string, string> | undefined;
    }, {
        theme?: Record<string, string> | undefined;
        light?: Record<string, string> | undefined;
        dark?: Record<string, string> | undefined;
    }>>;
    css: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodType<any, z.ZodTypeDef, any>>>;
    envVars: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    docs: z.ZodOptional<z.ZodString>;
    categories: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
} & {
    type: z.ZodLiteral<"registry:base">;
    config: z.ZodOptional<z.ZodObject<{
        $schema: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        style: z.ZodOptional<z.ZodString>;
        rsc: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
        tsx: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
        tailwind: z.ZodOptional<z.ZodObject<{
            config: z.ZodOptional<z.ZodOptional<z.ZodString>>;
            css: z.ZodOptional<z.ZodString>;
            baseColor: z.ZodOptional<z.ZodString>;
            cssVariables: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
            prefix: z.ZodOptional<z.ZodOptional<z.ZodDefault<z.ZodString>>>;
        }, "strip", z.ZodTypeAny, {
            config?: string | undefined;
            css?: string | undefined;
            baseColor?: string | undefined;
            cssVariables?: boolean | undefined;
            prefix?: string | undefined;
        }, {
            config?: string | undefined;
            css?: string | undefined;
            baseColor?: string | undefined;
            cssVariables?: boolean | undefined;
            prefix?: string | undefined;
        }>>;
        iconLibrary: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        rtl: z.ZodOptional<z.ZodOptional<z.ZodDefault<z.ZodBoolean>>>;
        menuColor: z.ZodOptional<z.ZodOptional<z.ZodDefault<z.ZodEnum<["default", "inverted", "default-translucent", "inverted-translucent"]>>>>;
        menuAccent: z.ZodOptional<z.ZodOptional<z.ZodDefault<z.ZodEnum<["subtle", "bold"]>>>>;
        aliases: z.ZodOptional<z.ZodObject<{
            components: z.ZodOptional<z.ZodString>;
            utils: z.ZodOptional<z.ZodString>;
            ui: z.ZodOptional<z.ZodOptional<z.ZodString>>;
            lib: z.ZodOptional<z.ZodOptional<z.ZodString>>;
            hooks: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            ui?: string | undefined;
            components?: string | undefined;
            utils?: string | undefined;
            lib?: string | undefined;
            hooks?: string | undefined;
        }, {
            ui?: string | undefined;
            components?: string | undefined;
            utils?: string | undefined;
            lib?: string | undefined;
            hooks?: string | undefined;
        }>>;
        registries: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodEffects<z.ZodString, string, string>, z.ZodUnion<[z.ZodEffects<z.ZodString, string, string>, z.ZodObject<{
            url: z.ZodEffects<z.ZodString, string, string>;
            params: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            url: string;
            params?: Record<string, string> | undefined;
            headers?: Record<string, string> | undefined;
        }, {
            url: string;
            params?: Record<string, string> | undefined;
            headers?: Record<string, string> | undefined;
        }>]>>>>;
    }, "strict", z.ZodTypeAny, {
        tailwind?: {
            config?: string | undefined;
            css?: string | undefined;
            baseColor?: string | undefined;
            cssVariables?: boolean | undefined;
            prefix?: string | undefined;
        } | undefined;
        $schema?: string | undefined;
        style?: string | undefined;
        rsc?: boolean | undefined;
        tsx?: boolean | undefined;
        iconLibrary?: string | undefined;
        rtl?: boolean | undefined;
        menuColor?: "default" | "inverted" | "default-translucent" | "inverted-translucent" | undefined;
        menuAccent?: "bold" | "subtle" | undefined;
        aliases?: {
            ui?: string | undefined;
            components?: string | undefined;
            utils?: string | undefined;
            lib?: string | undefined;
            hooks?: string | undefined;
        } | undefined;
        registries?: Record<string, string | {
            url: string;
            params?: Record<string, string> | undefined;
            headers?: Record<string, string> | undefined;
        }> | undefined;
    }, {
        tailwind?: {
            config?: string | undefined;
            css?: string | undefined;
            baseColor?: string | undefined;
            cssVariables?: boolean | undefined;
            prefix?: string | undefined;
        } | undefined;
        $schema?: string | undefined;
        style?: string | undefined;
        rsc?: boolean | undefined;
        tsx?: boolean | undefined;
        iconLibrary?: string | undefined;
        rtl?: boolean | undefined;
        menuColor?: "default" | "inverted" | "default-translucent" | "inverted-translucent" | undefined;
        menuAccent?: "bold" | "subtle" | undefined;
        aliases?: {
            ui?: string | undefined;
            components?: string | undefined;
            utils?: string | undefined;
            lib?: string | undefined;
            hooks?: string | undefined;
        } | undefined;
        registries?: Record<string, string | {
            url: string;
            params?: Record<string, string> | undefined;
            headers?: Record<string, string> | undefined;
        }> | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    type: "registry:base";
    name: string;
    tailwind?: {
        config?: {
            content?: string[] | undefined;
            theme?: Record<string, any> | undefined;
            plugins?: string[] | undefined;
        } | undefined;
    } | undefined;
    docs?: string | undefined;
    $schema?: string | undefined;
    config?: {
        tailwind?: {
            config?: string | undefined;
            css?: string | undefined;
            baseColor?: string | undefined;
            cssVariables?: boolean | undefined;
            prefix?: string | undefined;
        } | undefined;
        $schema?: string | undefined;
        style?: string | undefined;
        rsc?: boolean | undefined;
        tsx?: boolean | undefined;
        iconLibrary?: string | undefined;
        rtl?: boolean | undefined;
        menuColor?: "default" | "inverted" | "default-translucent" | "inverted-translucent" | undefined;
        menuAccent?: "bold" | "subtle" | undefined;
        aliases?: {
            ui?: string | undefined;
            components?: string | undefined;
            utils?: string | undefined;
            lib?: string | undefined;
            hooks?: string | undefined;
        } | undefined;
        registries?: Record<string, string | {
            url: string;
            params?: Record<string, string> | undefined;
            headers?: Record<string, string> | undefined;
        }> | undefined;
    } | undefined;
    css?: Record<string, any> | undefined;
    extends?: string | undefined;
    title?: string | undefined;
    author?: string | undefined;
    description?: string | undefined;
    dependencies?: string[] | undefined;
    devDependencies?: string[] | undefined;
    registryDependencies?: string[] | undefined;
    files?: ({
        path: string;
        type: "registry:page" | "registry:file";
        target: string;
        content?: string | undefined;
    } | {
        path: string;
        type: "registry:lib" | "registry:block" | "registry:component" | "registry:ui" | "registry:hook" | "registry:theme" | "registry:style" | "registry:item" | "registry:base" | "registry:font" | "registry:example" | "registry:internal";
        content?: string | undefined;
        target?: string | undefined;
    })[] | undefined;
    cssVars?: {
        theme?: Record<string, string> | undefined;
        light?: Record<string, string> | undefined;
        dark?: Record<string, string> | undefined;
    } | undefined;
    envVars?: Record<string, string> | undefined;
    meta?: Record<string, any> | undefined;
    categories?: string[] | undefined;
}, {
    type: "registry:base";
    name: string;
    tailwind?: {
        config?: {
            content?: string[] | undefined;
            theme?: Record<string, any> | undefined;
            plugins?: string[] | undefined;
        } | undefined;
    } | undefined;
    docs?: string | undefined;
    $schema?: string | undefined;
    config?: {
        tailwind?: {
            config?: string | undefined;
            css?: string | undefined;
            baseColor?: string | undefined;
            cssVariables?: boolean | undefined;
            prefix?: string | undefined;
        } | undefined;
        $schema?: string | undefined;
        style?: string | undefined;
        rsc?: boolean | undefined;
        tsx?: boolean | undefined;
        iconLibrary?: string | undefined;
        rtl?: boolean | undefined;
        menuColor?: "default" | "inverted" | "default-translucent" | "inverted-translucent" | undefined;
        menuAccent?: "bold" | "subtle" | undefined;
        aliases?: {
            ui?: string | undefined;
            components?: string | undefined;
            utils?: string | undefined;
            lib?: string | undefined;
            hooks?: string | undefined;
        } | undefined;
        registries?: Record<string, string | {
            url: string;
            params?: Record<string, string> | undefined;
            headers?: Record<string, string> | undefined;
        }> | undefined;
    } | undefined;
    css?: Record<string, any> | undefined;
    extends?: string | undefined;
    title?: string | undefined;
    author?: string | undefined;
    description?: string | undefined;
    dependencies?: string[] | undefined;
    devDependencies?: string[] | undefined;
    registryDependencies?: string[] | undefined;
    files?: ({
        path: string;
        type: "registry:page" | "registry:file";
        target: string;
        content?: string | undefined;
    } | {
        path: string;
        type: "registry:lib" | "registry:block" | "registry:component" | "registry:ui" | "registry:hook" | "registry:theme" | "registry:style" | "registry:item" | "registry:base" | "registry:font" | "registry:example" | "registry:internal";
        content?: string | undefined;
        target?: string | undefined;
    })[] | undefined;
    cssVars?: {
        theme?: Record<string, string> | undefined;
        light?: Record<string, string> | undefined;
        dark?: Record<string, string> | undefined;
    } | undefined;
    envVars?: Record<string, string> | undefined;
    meta?: Record<string, any> | undefined;
    categories?: string[] | undefined;
}>, z.ZodObject<{
    $schema: z.ZodOptional<z.ZodString>;
    extends: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
    author: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    dependencies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    devDependencies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    registryDependencies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    files: z.ZodOptional<z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
        path: z.ZodString;
        content: z.ZodOptional<z.ZodString>;
        type: z.ZodEnum<["registry:file", "registry:page"]>;
        target: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        path: string;
        type: "registry:page" | "registry:file";
        target: string;
        content?: string | undefined;
    }, {
        path: string;
        type: "registry:page" | "registry:file";
        target: string;
        content?: string | undefined;
    }>, z.ZodObject<{
        path: z.ZodString;
        content: z.ZodOptional<z.ZodString>;
        type: z.ZodEnum<["registry:lib", "registry:block", "registry:component", "registry:ui", "registry:hook", "registry:theme", "registry:style", "registry:item", "registry:base", "registry:font", "registry:example", "registry:internal"]>;
        target: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        path: string;
        type: "registry:lib" | "registry:block" | "registry:component" | "registry:ui" | "registry:hook" | "registry:theme" | "registry:style" | "registry:item" | "registry:base" | "registry:font" | "registry:example" | "registry:internal";
        content?: string | undefined;
        target?: string | undefined;
    }, {
        path: string;
        type: "registry:lib" | "registry:block" | "registry:component" | "registry:ui" | "registry:hook" | "registry:theme" | "registry:style" | "registry:item" | "registry:base" | "registry:font" | "registry:example" | "registry:internal";
        content?: string | undefined;
        target?: string | undefined;
    }>]>, "many">>;
    tailwind: z.ZodOptional<z.ZodObject<{
        config: z.ZodOptional<z.ZodObject<{
            content: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            theme: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            plugins: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            content?: string[] | undefined;
            theme?: Record<string, any> | undefined;
            plugins?: string[] | undefined;
        }, {
            content?: string[] | undefined;
            theme?: Record<string, any> | undefined;
            plugins?: string[] | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        config?: {
            content?: string[] | undefined;
            theme?: Record<string, any> | undefined;
            plugins?: string[] | undefined;
        } | undefined;
    }, {
        config?: {
            content?: string[] | undefined;
            theme?: Record<string, any> | undefined;
            plugins?: string[] | undefined;
        } | undefined;
    }>>;
    cssVars: z.ZodOptional<z.ZodObject<{
        theme: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        light: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        dark: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        theme?: Record<string, string> | undefined;
        light?: Record<string, string> | undefined;
        dark?: Record<string, string> | undefined;
    }, {
        theme?: Record<string, string> | undefined;
        light?: Record<string, string> | undefined;
        dark?: Record<string, string> | undefined;
    }>>;
    css: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodType<any, z.ZodTypeDef, any>>>;
    envVars: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    docs: z.ZodOptional<z.ZodString>;
    categories: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
} & {
    type: z.ZodLiteral<"registry:font">;
    font: z.ZodObject<{
        family: z.ZodString;
        provider: z.ZodLiteral<"google">;
        import: z.ZodString;
        variable: z.ZodString;
        weight: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        subsets: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        selector: z.ZodOptional<z.ZodString>;
        dependency: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        family: string;
        provider: "google";
        import: string;
        variable: string;
        weight?: string[] | undefined;
        subsets?: string[] | undefined;
        selector?: string | undefined;
        dependency?: string | undefined;
    }, {
        family: string;
        provider: "google";
        import: string;
        variable: string;
        weight?: string[] | undefined;
        subsets?: string[] | undefined;
        selector?: string | undefined;
        dependency?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "registry:font";
    name: string;
    font: {
        family: string;
        provider: "google";
        import: string;
        variable: string;
        weight?: string[] | undefined;
        subsets?: string[] | undefined;
        selector?: string | undefined;
        dependency?: string | undefined;
    };
    tailwind?: {
        config?: {
            content?: string[] | undefined;
            theme?: Record<string, any> | undefined;
            plugins?: string[] | undefined;
        } | undefined;
    } | undefined;
    docs?: string | undefined;
    $schema?: string | undefined;
    css?: Record<string, any> | undefined;
    extends?: string | undefined;
    title?: string | undefined;
    author?: string | undefined;
    description?: string | undefined;
    dependencies?: string[] | undefined;
    devDependencies?: string[] | undefined;
    registryDependencies?: string[] | undefined;
    files?: ({
        path: string;
        type: "registry:page" | "registry:file";
        target: string;
        content?: string | undefined;
    } | {
        path: string;
        type: "registry:lib" | "registry:block" | "registry:component" | "registry:ui" | "registry:hook" | "registry:theme" | "registry:style" | "registry:item" | "registry:base" | "registry:font" | "registry:example" | "registry:internal";
        content?: string | undefined;
        target?: string | undefined;
    })[] | undefined;
    cssVars?: {
        theme?: Record<string, string> | undefined;
        light?: Record<string, string> | undefined;
        dark?: Record<string, string> | undefined;
    } | undefined;
    envVars?: Record<string, string> | undefined;
    meta?: Record<string, any> | undefined;
    categories?: string[] | undefined;
}, {
    type: "registry:font";
    name: string;
    font: {
        family: string;
        provider: "google";
        import: string;
        variable: string;
        weight?: string[] | undefined;
        subsets?: string[] | undefined;
        selector?: string | undefined;
        dependency?: string | undefined;
    };
    tailwind?: {
        config?: {
            content?: string[] | undefined;
            theme?: Record<string, any> | undefined;
            plugins?: string[] | undefined;
        } | undefined;
    } | undefined;
    docs?: string | undefined;
    $schema?: string | undefined;
    css?: Record<string, any> | undefined;
    extends?: string | undefined;
    title?: string | undefined;
    author?: string | undefined;
    description?: string | undefined;
    dependencies?: string[] | undefined;
    devDependencies?: string[] | undefined;
    registryDependencies?: string[] | undefined;
    files?: ({
        path: string;
        type: "registry:page" | "registry:file";
        target: string;
        content?: string | undefined;
    } | {
        path: string;
        type: "registry:lib" | "registry:block" | "registry:component" | "registry:ui" | "registry:hook" | "registry:theme" | "registry:style" | "registry:item" | "registry:base" | "registry:font" | "registry:example" | "registry:internal";
        content?: string | undefined;
        target?: string | undefined;
    })[] | undefined;
    cssVars?: {
        theme?: Record<string, string> | undefined;
        light?: Record<string, string> | undefined;
        dark?: Record<string, string> | undefined;
    } | undefined;
    envVars?: Record<string, string> | undefined;
    meta?: Record<string, any> | undefined;
    categories?: string[] | undefined;
}>, z.ZodObject<{
    $schema: z.ZodOptional<z.ZodString>;
    extends: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
    author: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    dependencies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    devDependencies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    registryDependencies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    files: z.ZodOptional<z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
        path: z.ZodString;
        content: z.ZodOptional<z.ZodString>;
        type: z.ZodEnum<["registry:file", "registry:page"]>;
        target: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        path: string;
        type: "registry:page" | "registry:file";
        target: string;
        content?: string | undefined;
    }, {
        path: string;
        type: "registry:page" | "registry:file";
        target: string;
        content?: string | undefined;
    }>, z.ZodObject<{
        path: z.ZodString;
        content: z.ZodOptional<z.ZodString>;
        type: z.ZodEnum<["registry:lib", "registry:block", "registry:component", "registry:ui", "registry:hook", "registry:theme", "registry:style", "registry:item", "registry:base", "registry:font", "registry:example", "registry:internal"]>;
        target: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        path: string;
        type: "registry:lib" | "registry:block" | "registry:component" | "registry:ui" | "registry:hook" | "registry:theme" | "registry:style" | "registry:item" | "registry:base" | "registry:font" | "registry:example" | "registry:internal";
        content?: string | undefined;
        target?: string | undefined;
    }, {
        path: string;
        type: "registry:lib" | "registry:block" | "registry:component" | "registry:ui" | "registry:hook" | "registry:theme" | "registry:style" | "registry:item" | "registry:base" | "registry:font" | "registry:example" | "registry:internal";
        content?: string | undefined;
        target?: string | undefined;
    }>]>, "many">>;
    tailwind: z.ZodOptional<z.ZodObject<{
        config: z.ZodOptional<z.ZodObject<{
            content: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            theme: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            plugins: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            content?: string[] | undefined;
            theme?: Record<string, any> | undefined;
            plugins?: string[] | undefined;
        }, {
            content?: string[] | undefined;
            theme?: Record<string, any> | undefined;
            plugins?: string[] | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        config?: {
            content?: string[] | undefined;
            theme?: Record<string, any> | undefined;
            plugins?: string[] | undefined;
        } | undefined;
    }, {
        config?: {
            content?: string[] | undefined;
            theme?: Record<string, any> | undefined;
            plugins?: string[] | undefined;
        } | undefined;
    }>>;
    cssVars: z.ZodOptional<z.ZodObject<{
        theme: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        light: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        dark: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        theme?: Record<string, string> | undefined;
        light?: Record<string, string> | undefined;
        dark?: Record<string, string> | undefined;
    }, {
        theme?: Record<string, string> | undefined;
        light?: Record<string, string> | undefined;
        dark?: Record<string, string> | undefined;
    }>>;
    css: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodType<any, z.ZodTypeDef, any>>>;
    envVars: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    docs: z.ZodOptional<z.ZodString>;
    categories: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
} & {
    type: z.ZodEnum<["registry:lib", "registry:block", "registry:component", "registry:ui", "registry:hook", "registry:page", "registry:file", "registry:theme", "registry:style", "registry:item", "registry:example", "registry:internal"]>;
}, "strip", z.ZodTypeAny, {
    type: "registry:lib" | "registry:block" | "registry:component" | "registry:ui" | "registry:hook" | "registry:page" | "registry:file" | "registry:theme" | "registry:style" | "registry:item" | "registry:example" | "registry:internal";
    name: string;
    tailwind?: {
        config?: {
            content?: string[] | undefined;
            theme?: Record<string, any> | undefined;
            plugins?: string[] | undefined;
        } | undefined;
    } | undefined;
    docs?: string | undefined;
    $schema?: string | undefined;
    css?: Record<string, any> | undefined;
    extends?: string | undefined;
    title?: string | undefined;
    author?: string | undefined;
    description?: string | undefined;
    dependencies?: string[] | undefined;
    devDependencies?: string[] | undefined;
    registryDependencies?: string[] | undefined;
    files?: ({
        path: string;
        type: "registry:page" | "registry:file";
        target: string;
        content?: string | undefined;
    } | {
        path: string;
        type: "registry:lib" | "registry:block" | "registry:component" | "registry:ui" | "registry:hook" | "registry:theme" | "registry:style" | "registry:item" | "registry:base" | "registry:font" | "registry:example" | "registry:internal";
        content?: string | undefined;
        target?: string | undefined;
    })[] | undefined;
    cssVars?: {
        theme?: Record<string, string> | undefined;
        light?: Record<string, string> | undefined;
        dark?: Record<string, string> | undefined;
    } | undefined;
    envVars?: Record<string, string> | undefined;
    meta?: Record<string, any> | undefined;
    categories?: string[] | undefined;
}, {
    type: "registry:lib" | "registry:block" | "registry:component" | "registry:ui" | "registry:hook" | "registry:page" | "registry:file" | "registry:theme" | "registry:style" | "registry:item" | "registry:example" | "registry:internal";
    name: string;
    tailwind?: {
        config?: {
            content?: string[] | undefined;
            theme?: Record<string, any> | undefined;
            plugins?: string[] | undefined;
        } | undefined;
    } | undefined;
    docs?: string | undefined;
    $schema?: string | undefined;
    css?: Record<string, any> | undefined;
    extends?: string | undefined;
    title?: string | undefined;
    author?: string | undefined;
    description?: string | undefined;
    dependencies?: string[] | undefined;
    devDependencies?: string[] | undefined;
    registryDependencies?: string[] | undefined;
    files?: ({
        path: string;
        type: "registry:page" | "registry:file";
        target: string;
        content?: string | undefined;
    } | {
        path: string;
        type: "registry:lib" | "registry:block" | "registry:component" | "registry:ui" | "registry:hook" | "registry:theme" | "registry:style" | "registry:item" | "registry:base" | "registry:font" | "registry:example" | "registry:internal";
        content?: string | undefined;
        target?: string | undefined;
    })[] | undefined;
    cssVars?: {
        theme?: Record<string, string> | undefined;
        light?: Record<string, string> | undefined;
        dark?: Record<string, string> | undefined;
    } | undefined;
    envVars?: Record<string, string> | undefined;
    meta?: Record<string, any> | undefined;
    categories?: string[] | undefined;
}>]>, "many">;

type Config = z.infer<typeof configSchema>;

declare function getRegistry(name: string, options?: {
    config?: Partial<Config>;
    useCache?: boolean;
}): Promise<{
    name: string;
    homepage: string;
    items: ({
        type: "registry:base";
        name: string;
        tailwind?: {
            config?: {
                content?: string[] | undefined;
                theme?: Record<string, any> | undefined;
                plugins?: string[] | undefined;
            } | undefined;
        } | undefined;
        docs?: string | undefined;
        $schema?: string | undefined;
        config?: {
            tailwind?: {
                config?: string | undefined;
                css?: string | undefined;
                baseColor?: string | undefined;
                cssVariables?: boolean | undefined;
                prefix?: string | undefined;
            } | undefined;
            $schema?: string | undefined;
            style?: string | undefined;
            rsc?: boolean | undefined;
            tsx?: boolean | undefined;
            iconLibrary?: string | undefined;
            rtl?: boolean | undefined;
            menuColor?: "default" | "inverted" | "default-translucent" | "inverted-translucent" | undefined;
            menuAccent?: "bold" | "subtle" | undefined;
            aliases?: {
                ui?: string | undefined;
                components?: string | undefined;
                utils?: string | undefined;
                lib?: string | undefined;
                hooks?: string | undefined;
            } | undefined;
            registries?: Record<string, string | {
                url: string;
                params?: Record<string, string> | undefined;
                headers?: Record<string, string> | undefined;
            }> | undefined;
        } | undefined;
        css?: Record<string, any> | undefined;
        extends?: string | undefined;
        title?: string | undefined;
        author?: string | undefined;
        description?: string | undefined;
        dependencies?: string[] | undefined;
        devDependencies?: string[] | undefined;
        registryDependencies?: string[] | undefined;
        files?: ({
            path: string;
            type: "registry:page" | "registry:file";
            target: string;
            content?: string | undefined;
        } | {
            path: string;
            type: "registry:lib" | "registry:block" | "registry:component" | "registry:ui" | "registry:hook" | "registry:theme" | "registry:style" | "registry:item" | "registry:base" | "registry:font" | "registry:example" | "registry:internal";
            content?: string | undefined;
            target?: string | undefined;
        })[] | undefined;
        cssVars?: {
            theme?: Record<string, string> | undefined;
            light?: Record<string, string> | undefined;
            dark?: Record<string, string> | undefined;
        } | undefined;
        envVars?: Record<string, string> | undefined;
        meta?: Record<string, any> | undefined;
        categories?: string[] | undefined;
    } | {
        type: "registry:font";
        name: string;
        font: {
            family: string;
            provider: "google";
            import: string;
            variable: string;
            weight?: string[] | undefined;
            subsets?: string[] | undefined;
            selector?: string | undefined;
            dependency?: string | undefined;
        };
        tailwind?: {
            config?: {
                content?: string[] | undefined;
                theme?: Record<string, any> | undefined;
                plugins?: string[] | undefined;
            } | undefined;
        } | undefined;
        docs?: string | undefined;
        $schema?: string | undefined;
        css?: Record<string, any> | undefined;
        extends?: string | undefined;
        title?: string | undefined;
        author?: string | undefined;
        description?: string | undefined;
        dependencies?: string[] | undefined;
        devDependencies?: string[] | undefined;
        registryDependencies?: string[] | undefined;
        files?: ({
            path: string;
            type: "registry:page" | "registry:file";
            target: string;
            content?: string | undefined;
        } | {
            path: string;
            type: "registry:lib" | "registry:block" | "registry:component" | "registry:ui" | "registry:hook" | "registry:theme" | "registry:style" | "registry:item" | "registry:base" | "registry:font" | "registry:example" | "registry:internal";
            content?: string | undefined;
            target?: string | undefined;
        })[] | undefined;
        cssVars?: {
            theme?: Record<string, string> | undefined;
            light?: Record<string, string> | undefined;
            dark?: Record<string, string> | undefined;
        } | undefined;
        envVars?: Record<string, string> | undefined;
        meta?: Record<string, any> | undefined;
        categories?: string[] | undefined;
    } | {
        type: "registry:lib" | "registry:block" | "registry:component" | "registry:ui" | "registry:hook" | "registry:page" | "registry:file" | "registry:theme" | "registry:style" | "registry:item" | "registry:example" | "registry:internal";
        name: string;
        tailwind?: {
            config?: {
                content?: string[] | undefined;
                theme?: Record<string, any> | undefined;
                plugins?: string[] | undefined;
            } | undefined;
        } | undefined;
        docs?: string | undefined;
        $schema?: string | undefined;
        css?: Record<string, any> | undefined;
        extends?: string | undefined;
        title?: string | undefined;
        author?: string | undefined;
        description?: string | undefined;
        dependencies?: string[] | undefined;
        devDependencies?: string[] | undefined;
        registryDependencies?: string[] | undefined;
        files?: ({
            path: string;
            type: "registry:page" | "registry:file";
            target: string;
            content?: string | undefined;
        } | {
            path: string;
            type: "registry:lib" | "registry:block" | "registry:component" | "registry:ui" | "registry:hook" | "registry:theme" | "registry:style" | "registry:item" | "registry:base" | "registry:font" | "registry:example" | "registry:internal";
            content?: string | undefined;
            target?: string | undefined;
        })[] | undefined;
        cssVars?: {
            theme?: Record<string, string> | undefined;
            light?: Record<string, string> | undefined;
            dark?: Record<string, string> | undefined;
        } | undefined;
        envVars?: Record<string, string> | undefined;
        meta?: Record<string, any> | undefined;
        categories?: string[] | undefined;
    })[];
}>;
declare function getRegistryItems(items: string[], options?: {
    config?: Partial<Config>;
    useCache?: boolean;
}): Promise<({
    type: "registry:base";
    name: string;
    tailwind?: {
        config?: {
            content?: string[] | undefined;
            theme?: Record<string, any> | undefined;
            plugins?: string[] | undefined;
        } | undefined;
    } | undefined;
    docs?: string | undefined;
    $schema?: string | undefined;
    config?: {
        tailwind?: {
            config?: string | undefined;
            css?: string | undefined;
            baseColor?: string | undefined;
            cssVariables?: boolean | undefined;
            prefix?: string | undefined;
        } | undefined;
        $schema?: string | undefined;
        style?: string | undefined;
        rsc?: boolean | undefined;
        tsx?: boolean | undefined;
        iconLibrary?: string | undefined;
        rtl?: boolean | undefined;
        menuColor?: "default" | "inverted" | "default-translucent" | "inverted-translucent" | undefined;
        menuAccent?: "bold" | "subtle" | undefined;
        aliases?: {
            ui?: string | undefined;
            components?: string | undefined;
            utils?: string | undefined;
            lib?: string | undefined;
            hooks?: string | undefined;
        } | undefined;
        registries?: Record<string, string | {
            url: string;
            params?: Record<string, string> | undefined;
            headers?: Record<string, string> | undefined;
        }> | undefined;
    } | undefined;
    css?: Record<string, any> | undefined;
    extends?: string | undefined;
    title?: string | undefined;
    author?: string | undefined;
    description?: string | undefined;
    dependencies?: string[] | undefined;
    devDependencies?: string[] | undefined;
    registryDependencies?: string[] | undefined;
    files?: ({
        path: string;
        type: "registry:page" | "registry:file";
        target: string;
        content?: string | undefined;
    } | {
        path: string;
        type: "registry:lib" | "registry:block" | "registry:component" | "registry:ui" | "registry:hook" | "registry:theme" | "registry:style" | "registry:item" | "registry:base" | "registry:font" | "registry:example" | "registry:internal";
        content?: string | undefined;
        target?: string | undefined;
    })[] | undefined;
    cssVars?: {
        theme?: Record<string, string> | undefined;
        light?: Record<string, string> | undefined;
        dark?: Record<string, string> | undefined;
    } | undefined;
    envVars?: Record<string, string> | undefined;
    meta?: Record<string, any> | undefined;
    categories?: string[] | undefined;
} | {
    type: "registry:font";
    name: string;
    font: {
        family: string;
        provider: "google";
        import: string;
        variable: string;
        weight?: string[] | undefined;
        subsets?: string[] | undefined;
        selector?: string | undefined;
        dependency?: string | undefined;
    };
    tailwind?: {
        config?: {
            content?: string[] | undefined;
            theme?: Record<string, any> | undefined;
            plugins?: string[] | undefined;
        } | undefined;
    } | undefined;
    docs?: string | undefined;
    $schema?: string | undefined;
    css?: Record<string, any> | undefined;
    extends?: string | undefined;
    title?: string | undefined;
    author?: string | undefined;
    description?: string | undefined;
    dependencies?: string[] | undefined;
    devDependencies?: string[] | undefined;
    registryDependencies?: string[] | undefined;
    files?: ({
        path: string;
        type: "registry:page" | "registry:file";
        target: string;
        content?: string | undefined;
    } | {
        path: string;
        type: "registry:lib" | "registry:block" | "registry:component" | "registry:ui" | "registry:hook" | "registry:theme" | "registry:style" | "registry:item" | "registry:base" | "registry:font" | "registry:example" | "registry:internal";
        content?: string | undefined;
        target?: string | undefined;
    })[] | undefined;
    cssVars?: {
        theme?: Record<string, string> | undefined;
        light?: Record<string, string> | undefined;
        dark?: Record<string, string> | undefined;
    } | undefined;
    envVars?: Record<string, string> | undefined;
    meta?: Record<string, any> | undefined;
    categories?: string[] | undefined;
} | {
    type: "registry:lib" | "registry:block" | "registry:component" | "registry:ui" | "registry:hook" | "registry:page" | "registry:file" | "registry:theme" | "registry:style" | "registry:item" | "registry:example" | "registry:internal";
    name: string;
    tailwind?: {
        config?: {
            content?: string[] | undefined;
            theme?: Record<string, any> | undefined;
            plugins?: string[] | undefined;
        } | undefined;
    } | undefined;
    docs?: string | undefined;
    $schema?: string | undefined;
    css?: Record<string, any> | undefined;
    extends?: string | undefined;
    title?: string | undefined;
    author?: string | undefined;
    description?: string | undefined;
    dependencies?: string[] | undefined;
    devDependencies?: string[] | undefined;
    registryDependencies?: string[] | undefined;
    files?: ({
        path: string;
        type: "registry:page" | "registry:file";
        target: string;
        content?: string | undefined;
    } | {
        path: string;
        type: "registry:lib" | "registry:block" | "registry:component" | "registry:ui" | "registry:hook" | "registry:theme" | "registry:style" | "registry:item" | "registry:base" | "registry:font" | "registry:example" | "registry:internal";
        content?: string | undefined;
        target?: string | undefined;
    })[] | undefined;
    cssVars?: {
        theme?: Record<string, string> | undefined;
        light?: Record<string, string> | undefined;
        dark?: Record<string, string> | undefined;
    } | undefined;
    envVars?: Record<string, string> | undefined;
    meta?: Record<string, any> | undefined;
    categories?: string[] | undefined;
})[]>;
declare function resolveRegistryItems(items: string[], options?: {
    config?: Partial<Config>;
    useCache?: boolean;
}): Promise<{
    tailwind?: {
        config?: {
            content?: string[] | undefined;
            theme?: Record<string, any> | undefined;
            plugins?: string[] | undefined;
        } | undefined;
    } | undefined;
    docs?: string | undefined;
    css?: Record<string, any> | undefined;
    dependencies?: string[] | undefined;
    devDependencies?: string[] | undefined;
    files?: ({
        path: string;
        type: "registry:page" | "registry:file";
        target: string;
        content?: string | undefined;
    } | {
        path: string;
        type: "registry:lib" | "registry:block" | "registry:component" | "registry:ui" | "registry:hook" | "registry:theme" | "registry:style" | "registry:item" | "registry:base" | "registry:font" | "registry:example" | "registry:internal";
        content?: string | undefined;
        target?: string | undefined;
    })[] | undefined;
    cssVars?: {
        theme?: Record<string, string> | undefined;
        light?: Record<string, string> | undefined;
        dark?: Record<string, string> | undefined;
    } | undefined;
    envVars?: Record<string, string> | undefined;
    fonts?: {
        type: "registry:font";
        name: string;
        font: {
            family: string;
            provider: "google";
            import: string;
            variable: string;
            weight?: string[] | undefined;
            subsets?: string[] | undefined;
            selector?: string | undefined;
            dependency?: string | undefined;
        };
        tailwind?: {
            config?: {
                content?: string[] | undefined;
                theme?: Record<string, any> | undefined;
                plugins?: string[] | undefined;
            } | undefined;
        } | undefined;
        docs?: string | undefined;
        $schema?: string | undefined;
        css?: Record<string, any> | undefined;
        extends?: string | undefined;
        title?: string | undefined;
        author?: string | undefined;
        description?: string | undefined;
        dependencies?: string[] | undefined;
        devDependencies?: string[] | undefined;
        registryDependencies?: string[] | undefined;
        files?: ({
            path: string;
            type: "registry:page" | "registry:file";
            target: string;
            content?: string | undefined;
        } | {
            path: string;
            type: "registry:lib" | "registry:block" | "registry:component" | "registry:ui" | "registry:hook" | "registry:theme" | "registry:style" | "registry:item" | "registry:base" | "registry:font" | "registry:example" | "registry:internal";
            content?: string | undefined;
            target?: string | undefined;
        })[] | undefined;
        cssVars?: {
            theme?: Record<string, string> | undefined;
            light?: Record<string, string> | undefined;
            dark?: Record<string, string> | undefined;
        } | undefined;
        envVars?: Record<string, string> | undefined;
        meta?: Record<string, any> | undefined;
        categories?: string[] | undefined;
    }[] | undefined;
} | null>;
declare function getRegistriesConfig(cwd: string, options?: {
    useCache?: boolean;
}): Promise<{
    registries: Record<string, string | {
        url: string;
        params?: Record<string, string> | undefined;
        headers?: Record<string, string> | undefined;
    }>;
}>;
declare function getShadcnRegistryIndex(): Promise<({
    type: "registry:base";
    name: string;
    tailwind?: {
        config?: {
            content?: string[] | undefined;
            theme?: Record<string, any> | undefined;
            plugins?: string[] | undefined;
        } | undefined;
    } | undefined;
    docs?: string | undefined;
    $schema?: string | undefined;
    config?: {
        tailwind?: {
            config?: string | undefined;
            css?: string | undefined;
            baseColor?: string | undefined;
            cssVariables?: boolean | undefined;
            prefix?: string | undefined;
        } | undefined;
        $schema?: string | undefined;
        style?: string | undefined;
        rsc?: boolean | undefined;
        tsx?: boolean | undefined;
        iconLibrary?: string | undefined;
        rtl?: boolean | undefined;
        menuColor?: "default" | "inverted" | "default-translucent" | "inverted-translucent" | undefined;
        menuAccent?: "bold" | "subtle" | undefined;
        aliases?: {
            ui?: string | undefined;
            components?: string | undefined;
            utils?: string | undefined;
            lib?: string | undefined;
            hooks?: string | undefined;
        } | undefined;
        registries?: Record<string, string | {
            url: string;
            params?: Record<string, string> | undefined;
            headers?: Record<string, string> | undefined;
        }> | undefined;
    } | undefined;
    css?: Record<string, any> | undefined;
    extends?: string | undefined;
    title?: string | undefined;
    author?: string | undefined;
    description?: string | undefined;
    dependencies?: string[] | undefined;
    devDependencies?: string[] | undefined;
    registryDependencies?: string[] | undefined;
    files?: ({
        path: string;
        type: "registry:page" | "registry:file";
        target: string;
        content?: string | undefined;
    } | {
        path: string;
        type: "registry:lib" | "registry:block" | "registry:component" | "registry:ui" | "registry:hook" | "registry:theme" | "registry:style" | "registry:item" | "registry:base" | "registry:font" | "registry:example" | "registry:internal";
        content?: string | undefined;
        target?: string | undefined;
    })[] | undefined;
    cssVars?: {
        theme?: Record<string, string> | undefined;
        light?: Record<string, string> | undefined;
        dark?: Record<string, string> | undefined;
    } | undefined;
    envVars?: Record<string, string> | undefined;
    meta?: Record<string, any> | undefined;
    categories?: string[] | undefined;
} | {
    type: "registry:font";
    name: string;
    font: {
        family: string;
        provider: "google";
        import: string;
        variable: string;
        weight?: string[] | undefined;
        subsets?: string[] | undefined;
        selector?: string | undefined;
        dependency?: string | undefined;
    };
    tailwind?: {
        config?: {
            content?: string[] | undefined;
            theme?: Record<string, any> | undefined;
            plugins?: string[] | undefined;
        } | undefined;
    } | undefined;
    docs?: string | undefined;
    $schema?: string | undefined;
    css?: Record<string, any> | undefined;
    extends?: string | undefined;
    title?: string | undefined;
    author?: string | undefined;
    description?: string | undefined;
    dependencies?: string[] | undefined;
    devDependencies?: string[] | undefined;
    registryDependencies?: string[] | undefined;
    files?: ({
        path: string;
        type: "registry:page" | "registry:file";
        target: string;
        content?: string | undefined;
    } | {
        path: string;
        type: "registry:lib" | "registry:block" | "registry:component" | "registry:ui" | "registry:hook" | "registry:theme" | "registry:style" | "registry:item" | "registry:base" | "registry:font" | "registry:example" | "registry:internal";
        content?: string | undefined;
        target?: string | undefined;
    })[] | undefined;
    cssVars?: {
        theme?: Record<string, string> | undefined;
        light?: Record<string, string> | undefined;
        dark?: Record<string, string> | undefined;
    } | undefined;
    envVars?: Record<string, string> | undefined;
    meta?: Record<string, any> | undefined;
    categories?: string[] | undefined;
} | {
    type: "registry:lib" | "registry:block" | "registry:component" | "registry:ui" | "registry:hook" | "registry:page" | "registry:file" | "registry:theme" | "registry:style" | "registry:item" | "registry:example" | "registry:internal";
    name: string;
    tailwind?: {
        config?: {
            content?: string[] | undefined;
            theme?: Record<string, any> | undefined;
            plugins?: string[] | undefined;
        } | undefined;
    } | undefined;
    docs?: string | undefined;
    $schema?: string | undefined;
    css?: Record<string, any> | undefined;
    extends?: string | undefined;
    title?: string | undefined;
    author?: string | undefined;
    description?: string | undefined;
    dependencies?: string[] | undefined;
    devDependencies?: string[] | undefined;
    registryDependencies?: string[] | undefined;
    files?: ({
        path: string;
        type: "registry:page" | "registry:file";
        target: string;
        content?: string | undefined;
    } | {
        path: string;
        type: "registry:lib" | "registry:block" | "registry:component" | "registry:ui" | "registry:hook" | "registry:theme" | "registry:style" | "registry:item" | "registry:base" | "registry:font" | "registry:example" | "registry:internal";
        content?: string | undefined;
        target?: string | undefined;
    })[] | undefined;
    cssVars?: {
        theme?: Record<string, string> | undefined;
        light?: Record<string, string> | undefined;
        dark?: Record<string, string> | undefined;
    } | undefined;
    envVars?: Record<string, string> | undefined;
    meta?: Record<string, any> | undefined;
    categories?: string[] | undefined;
})[] | undefined>;
declare function getRegistryStyles(): Promise<{
    name: string;
    label: string;
}[]>;
declare function getRegistryIcons(): Promise<Record<string, Record<string, string>>>;
declare function getRegistryBaseColors(): Promise<readonly [{
    readonly name: "neutral";
    readonly label: "Neutral";
}, {
    readonly name: "zinc";
    readonly label: "Zinc";
}, {
    readonly name: "stone";
    readonly label: "Stone";
}, {
    readonly name: "mauve";
    readonly label: "Mauve";
}, {
    readonly name: "olive";
    readonly label: "Olive";
}, {
    readonly name: "mist";
    readonly label: "Mist";
}, {
    readonly name: "taupe";
    readonly label: "Taupe";
}]>;
declare function getRegistryBaseColor(baseColor: string): Promise<{
    cssVars: {
        theme?: Record<string, string> | undefined;
        light?: Record<string, string> | undefined;
        dark?: Record<string, string> | undefined;
    };
    inlineColors: {
        light: Record<string, string>;
        dark: Record<string, string>;
    };
    inlineColorsTemplate: string;
    cssVarsTemplate: string;
    cssVarsV4?: {
        theme?: Record<string, string> | undefined;
        light?: Record<string, string> | undefined;
        dark?: Record<string, string> | undefined;
    } | undefined;
} | undefined>;
/**
 * @deprecated This function is deprecated and will be removed in a future version.
 */
declare function resolveTree(index: z.infer<typeof registryIndexSchema>, names: string[]): Promise<({
    type: "registry:base";
    name: string;
    tailwind?: {
        config?: {
            content?: string[] | undefined;
            theme?: Record<string, any> | undefined;
            plugins?: string[] | undefined;
        } | undefined;
    } | undefined;
    docs?: string | undefined;
    $schema?: string | undefined;
    config?: {
        tailwind?: {
            config?: string | undefined;
            css?: string | undefined;
            baseColor?: string | undefined;
            cssVariables?: boolean | undefined;
            prefix?: string | undefined;
        } | undefined;
        $schema?: string | undefined;
        style?: string | undefined;
        rsc?: boolean | undefined;
        tsx?: boolean | undefined;
        iconLibrary?: string | undefined;
        rtl?: boolean | undefined;
        menuColor?: "default" | "inverted" | "default-translucent" | "inverted-translucent" | undefined;
        menuAccent?: "bold" | "subtle" | undefined;
        aliases?: {
            ui?: string | undefined;
            components?: string | undefined;
            utils?: string | undefined;
            lib?: string | undefined;
            hooks?: string | undefined;
        } | undefined;
        registries?: Record<string, string | {
            url: string;
            params?: Record<string, string> | undefined;
            headers?: Record<string, string> | undefined;
        }> | undefined;
    } | undefined;
    css?: Record<string, any> | undefined;
    extends?: string | undefined;
    title?: string | undefined;
    author?: string | undefined;
    description?: string | undefined;
    dependencies?: string[] | undefined;
    devDependencies?: string[] | undefined;
    registryDependencies?: string[] | undefined;
    files?: ({
        path: string;
        type: "registry:page" | "registry:file";
        target: string;
        content?: string | undefined;
    } | {
        path: string;
        type: "registry:lib" | "registry:block" | "registry:component" | "registry:ui" | "registry:hook" | "registry:theme" | "registry:style" | "registry:item" | "registry:base" | "registry:font" | "registry:example" | "registry:internal";
        content?: string | undefined;
        target?: string | undefined;
    })[] | undefined;
    cssVars?: {
        theme?: Record<string, string> | undefined;
        light?: Record<string, string> | undefined;
        dark?: Record<string, string> | undefined;
    } | undefined;
    envVars?: Record<string, string> | undefined;
    meta?: Record<string, any> | undefined;
    categories?: string[] | undefined;
} | {
    type: "registry:font";
    name: string;
    font: {
        family: string;
        provider: "google";
        import: string;
        variable: string;
        weight?: string[] | undefined;
        subsets?: string[] | undefined;
        selector?: string | undefined;
        dependency?: string | undefined;
    };
    tailwind?: {
        config?: {
            content?: string[] | undefined;
            theme?: Record<string, any> | undefined;
            plugins?: string[] | undefined;
        } | undefined;
    } | undefined;
    docs?: string | undefined;
    $schema?: string | undefined;
    css?: Record<string, any> | undefined;
    extends?: string | undefined;
    title?: string | undefined;
    author?: string | undefined;
    description?: string | undefined;
    dependencies?: string[] | undefined;
    devDependencies?: string[] | undefined;
    registryDependencies?: string[] | undefined;
    files?: ({
        path: string;
        type: "registry:page" | "registry:file";
        target: string;
        content?: string | undefined;
    } | {
        path: string;
        type: "registry:lib" | "registry:block" | "registry:component" | "registry:ui" | "registry:hook" | "registry:theme" | "registry:style" | "registry:item" | "registry:base" | "registry:font" | "registry:example" | "registry:internal";
        content?: string | undefined;
        target?: string | undefined;
    })[] | undefined;
    cssVars?: {
        theme?: Record<string, string> | undefined;
        light?: Record<string, string> | undefined;
        dark?: Record<string, string> | undefined;
    } | undefined;
    envVars?: Record<string, string> | undefined;
    meta?: Record<string, any> | undefined;
    categories?: string[] | undefined;
} | {
    type: "registry:lib" | "registry:block" | "registry:component" | "registry:ui" | "registry:hook" | "registry:page" | "registry:file" | "registry:theme" | "registry:style" | "registry:item" | "registry:example" | "registry:internal";
    name: string;
    tailwind?: {
        config?: {
            content?: string[] | undefined;
            theme?: Record<string, any> | undefined;
            plugins?: string[] | undefined;
        } | undefined;
    } | undefined;
    docs?: string | undefined;
    $schema?: string | undefined;
    css?: Record<string, any> | undefined;
    extends?: string | undefined;
    title?: string | undefined;
    author?: string | undefined;
    description?: string | undefined;
    dependencies?: string[] | undefined;
    devDependencies?: string[] | undefined;
    registryDependencies?: string[] | undefined;
    files?: ({
        path: string;
        type: "registry:page" | "registry:file";
        target: string;
        content?: string | undefined;
    } | {
        path: string;
        type: "registry:lib" | "registry:block" | "registry:component" | "registry:ui" | "registry:hook" | "registry:theme" | "registry:style" | "registry:item" | "registry:base" | "registry:font" | "registry:example" | "registry:internal";
        content?: string | undefined;
        target?: string | undefined;
    })[] | undefined;
    cssVars?: {
        theme?: Record<string, string> | undefined;
        light?: Record<string, string> | undefined;
        dark?: Record<string, string> | undefined;
    } | undefined;
    envVars?: Record<string, string> | undefined;
    meta?: Record<string, any> | undefined;
    categories?: string[] | undefined;
})[]>;
/**
 * @deprecated This function is deprecated and will be removed in a future version.
 */
declare function fetchTree(style: string, tree: z.infer<typeof registryIndexSchema>): Promise<({
    type: "registry:base";
    name: string;
    tailwind?: {
        config?: {
            content?: string[] | undefined;
            theme?: Record<string, any> | undefined;
            plugins?: string[] | undefined;
        } | undefined;
    } | undefined;
    docs?: string | undefined;
    $schema?: string | undefined;
    config?: {
        tailwind?: {
            config?: string | undefined;
            css?: string | undefined;
            baseColor?: string | undefined;
            cssVariables?: boolean | undefined;
            prefix?: string | undefined;
        } | undefined;
        $schema?: string | undefined;
        style?: string | undefined;
        rsc?: boolean | undefined;
        tsx?: boolean | undefined;
        iconLibrary?: string | undefined;
        rtl?: boolean | undefined;
        menuColor?: "default" | "inverted" | "default-translucent" | "inverted-translucent" | undefined;
        menuAccent?: "bold" | "subtle" | undefined;
        aliases?: {
            ui?: string | undefined;
            components?: string | undefined;
            utils?: string | undefined;
            lib?: string | undefined;
            hooks?: string | undefined;
        } | undefined;
        registries?: Record<string, string | {
            url: string;
            params?: Record<string, string> | undefined;
            headers?: Record<string, string> | undefined;
        }> | undefined;
    } | undefined;
    css?: Record<string, any> | undefined;
    extends?: string | undefined;
    title?: string | undefined;
    author?: string | undefined;
    description?: string | undefined;
    dependencies?: string[] | undefined;
    devDependencies?: string[] | undefined;
    registryDependencies?: string[] | undefined;
    files?: ({
        path: string;
        type: "registry:page" | "registry:file";
        target: string;
        content?: string | undefined;
    } | {
        path: string;
        type: "registry:lib" | "registry:block" | "registry:component" | "registry:ui" | "registry:hook" | "registry:theme" | "registry:style" | "registry:item" | "registry:base" | "registry:font" | "registry:example" | "registry:internal";
        content?: string | undefined;
        target?: string | undefined;
    })[] | undefined;
    cssVars?: {
        theme?: Record<string, string> | undefined;
        light?: Record<string, string> | undefined;
        dark?: Record<string, string> | undefined;
    } | undefined;
    envVars?: Record<string, string> | undefined;
    meta?: Record<string, any> | undefined;
    categories?: string[] | undefined;
} | {
    type: "registry:font";
    name: string;
    font: {
        family: string;
        provider: "google";
        import: string;
        variable: string;
        weight?: string[] | undefined;
        subsets?: string[] | undefined;
        selector?: string | undefined;
        dependency?: string | undefined;
    };
    tailwind?: {
        config?: {
            content?: string[] | undefined;
            theme?: Record<string, any> | undefined;
            plugins?: string[] | undefined;
        } | undefined;
    } | undefined;
    docs?: string | undefined;
    $schema?: string | undefined;
    css?: Record<string, any> | undefined;
    extends?: string | undefined;
    title?: string | undefined;
    author?: string | undefined;
    description?: string | undefined;
    dependencies?: string[] | undefined;
    devDependencies?: string[] | undefined;
    registryDependencies?: string[] | undefined;
    files?: ({
        path: string;
        type: "registry:page" | "registry:file";
        target: string;
        content?: string | undefined;
    } | {
        path: string;
        type: "registry:lib" | "registry:block" | "registry:component" | "registry:ui" | "registry:hook" | "registry:theme" | "registry:style" | "registry:item" | "registry:base" | "registry:font" | "registry:example" | "registry:internal";
        content?: string | undefined;
        target?: string | undefined;
    })[] | undefined;
    cssVars?: {
        theme?: Record<string, string> | undefined;
        light?: Record<string, string> | undefined;
        dark?: Record<string, string> | undefined;
    } | undefined;
    envVars?: Record<string, string> | undefined;
    meta?: Record<string, any> | undefined;
    categories?: string[] | undefined;
} | {
    type: "registry:lib" | "registry:block" | "registry:component" | "registry:ui" | "registry:hook" | "registry:page" | "registry:file" | "registry:theme" | "registry:style" | "registry:item" | "registry:example" | "registry:internal";
    name: string;
    tailwind?: {
        config?: {
            content?: string[] | undefined;
            theme?: Record<string, any> | undefined;
            plugins?: string[] | undefined;
        } | undefined;
    } | undefined;
    docs?: string | undefined;
    $schema?: string | undefined;
    css?: Record<string, any> | undefined;
    extends?: string | undefined;
    title?: string | undefined;
    author?: string | undefined;
    description?: string | undefined;
    dependencies?: string[] | undefined;
    devDependencies?: string[] | undefined;
    registryDependencies?: string[] | undefined;
    files?: ({
        path: string;
        type: "registry:page" | "registry:file";
        target: string;
        content?: string | undefined;
    } | {
        path: string;
        type: "registry:lib" | "registry:block" | "registry:component" | "registry:ui" | "registry:hook" | "registry:theme" | "registry:style" | "registry:item" | "registry:base" | "registry:font" | "registry:example" | "registry:internal";
        content?: string | undefined;
        target?: string | undefined;
    })[] | undefined;
    cssVars?: {
        theme?: Record<string, string> | undefined;
        light?: Record<string, string> | undefined;
        dark?: Record<string, string> | undefined;
    } | undefined;
    envVars?: Record<string, string> | undefined;
    meta?: Record<string, any> | undefined;
    categories?: string[] | undefined;
})[]>;
/**
 * @deprecated This function is deprecated and will be removed in a future version.
 */
declare function getItemTargetPath(config: Config, item: Pick<z.infer<typeof registryItemSchema>, "type">, override?: string): Promise<string | null>;
declare function getRegistries(options?: {
    useCache?: boolean;
}): Promise<{
    url: string;
    name: string;
    description?: string | undefined;
    homepage?: string | undefined;
}[]>;
/**
 * @deprecated Use getRegistries() instead.
 */
declare function getRegistriesIndex(options?: {
    useCache?: boolean;
}): Promise<Record<string, string> | null>;
declare function getPresets(options?: {
    useCache?: boolean;
}): Promise<{
    style: string;
    baseColor: string;
    iconLibrary: string;
    rtl: boolean;
    menuColor: "default" | "inverted" | "default-translucent" | "inverted-translucent";
    menuAccent: "bold" | "subtle";
    theme: string;
    name: string;
    title: string;
    description: string;
    font: string;
    base: string;
    radius: string;
}[]>;
declare function getPreset(name: string, options?: {
    useCache?: boolean;
}): Promise<{
    style: string;
    baseColor: string;
    iconLibrary: string;
    rtl: boolean;
    menuColor: "default" | "inverted" | "default-translucent" | "inverted-translucent";
    menuAccent: "bold" | "subtle";
    theme: string;
    name: string;
    title: string;
    description: string;
    font: string;
    base: string;
    radius: string;
} | null>;

declare const program: Command;

export { fetchTree, getItemTargetPath, getPreset, getPresets, getRegistries, getRegistriesConfig, getRegistriesIndex, getRegistry, getRegistryBaseColor, getRegistryBaseColors, getRegistryIcons, getRegistryItems, getRegistryStyles, getShadcnRegistryIndex, program, resolveRegistryItems, resolveTree };
