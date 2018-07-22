import * as typescript from 'typescript';

// We need to add some additional information while
// we process AST nodes, this file extends typescript's
// definition file, based on our needs.

declare module 'typescript' {
  interface Node {
    // Mark visited Nodes, (to prevent a potential infinite loop).
    deno?: true;
    // Reference to the first parent node whose type is either
    // SourceFile or ModuleDeclaration.
    // (We use it to find the definition of identifiers and set
    // exports more efficiently.)
    scope?: Scope;
    // jsDoc is an internal property in typescript,
    // so we should redefine it here.
    // Note: Indeed jsDoc belongs to JSDocContainer interface
    // but based on how ast.ts:getDocumentation() works, it's
    // better to define this here rather than JSDocContainer.
    jsDoc?: JSDoc;
  }

  interface Identifier {
    // Cache result of ast.ts:findDefinition().
    def?: Node;
  }

  // Theoretically an scope has the same concept which is behind
  // Block here we just limit that to ModuleDeclaration (instead
  // of ModuleBlock) and sourceFile (in this special case we can
  // look at it as a block).I should remind that we DO NOT visit
  // inside a of a function or an if-statement and anything like
  // that.We aim to collect useful informations to create a doc.
  interface ScopeBase {
    // Map identifiers name to their local definition.
    locals?: Map<LocalNode>;
    // Exported members of the current scope.
    exports?: Map<ExportNode>;
  }
  interface SourceFile extends ScopeBase {
    scriptKind?: ScriptKind;
  }
  interface ModuleDeclaration extends ScopeBase {}
  type Scope = SourceFile | ModuleDeclaration;

  type LocalNode =
    | DenoDeclaration
    | ImportSpecifier
    | NamespaceImport
    | ImportClause
    // see cjs.ts
    | symbol;

  // Everything that means declaration to Deno's doc parser.
  type DenoDeclaration = 
    | FunctionLikeDeclaration
    | VariableDeclaration
    | InterfaceDeclaration
    | EnumDeclaration
    | ClassDeclaration
    | TypeAliasDeclaration;

  // Maybe we can store all exports as identifiers?
  type ExportNode = DenoDeclaration | ExportAssignment | Identifier;

  type Types = TypeNode | TypeReferenceType;
}