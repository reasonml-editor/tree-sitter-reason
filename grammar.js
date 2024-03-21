// REASON GRAMMAR

const PREC = {
  prefix: 19,
  dot: 18,
  hash: 17,
  app: 16,
  neg: 15,
  pow: 14,
  mult: 13,
  add: 12,
  cons: 11,
  concat: 10,
  rel: 9,
  and: 8,
  or: 7,
  prod: 6,
  assign: 5,
  if: 4,
  seq: 3,
  match: 2,

  // I added
  index: 2,
  block: 2,
};

module.exports = grammar(require("./embedded/ocaml"), {
  name: "reason",

  conflicts: ($) => [[$._value_name, $._jsx_identifier]],

  externals: ($) => [
    // Ocaml specific
    $._ocaml_comment,
    $._left_quoted_string_delimiter,
    $._right_quoted_string_delimiter,
    '"',
    $.line_number_directive,
    $._null,

    // Javascript
    $._automatic_semicolon,
  ],

  extras: ($) => [/\s/, $.comment],

  rules: {
    // TODO: add the actual grammar rules
    compilation_unit: ($) => repeat($._statement),

    _statement: ($) =>
      choice(
        $.let_binding,
        $.type_definition,
        $.expression_statement,
        $.open_statement,
        $.module_definition,
        $.mutable_record_update,
      ),

    expression_statement: ($) => seq($.expression, $._semicolon),
    open_statement: ($) => seq("open", $.module_path, $._semicolon),

    module_definition: ($) =>
      seq(
        "module",
        // optional($._attribute),
        optional("rec"),
        $.module_binding,
        $._semicolon,
      ),

    module_binding: ($) =>
      seq(
        field("name", choice($._module_name, alias("_", $.module_name))),
        repeat($.module_parameter),
        // optional($._module_typed),
        optional(seq(choice("=", ":="), field("body", $._module_expression))),
        // repeat($.item_attribute),
      ),

    _module_expression: ($) =>
      choice(
        $._simple_module_expression,
        $.module_path,
        // $.structure,
        // $.functor,
        // $.module_application,
      ),

    _simple_module_expression: ($) => $.block,

    mutable_record_update: ($) =>
      seq($.field_get_expression, "=", $.expression, $._semicolon),

    let_binding: ($) =>
      seq(
        "let",
        optional("rec"),
        field("pattern", choice($._value_name, $.record_destructure)),
        optional(seq(":", $._type)),
        "=",
        $.expression,
        $._semicolon,
      ),

    record_destructure: ($) =>
      seq("{", commaSep1($.record_destructure_field), "}"),
    record_destructure_field: ($) => $._value_name,

    expression: ($) =>
      choice($._expression, seq("(", $.expression, ":", $._type, ")")),

    _expression: ($) =>
      choice(
        $._simple_expression,
        $.application_expression,
        $.infix_expression,
        $.sign_expression,
        // $.set_expression,
        $.if_expression,
        $.ternary_expression,
        // $.while_expression,
        // $.for_expression,
        $.switch_expression,
        $.function_expression,
        // $.fun_expression,
        // $.try_expression,
        // $.let_expression,
        // $.assert_expression,
        // $.lazy_expression,
        // $.let_module_expression,
        // $.let_open_expression,
        // $.let_exception_expression

        // Reason Only
        $.unpack,

        // JSX
        $._jsx_element,
      ),

    _simple_expression: ($) =>
      choice(
        $.value_path,
        $._constant,
        // $.typed_expression,
        $.constructor_path,
        $.tag,
        $.list_expression,
        $.array_expression,
        $.product_expression,
        $.record_expression,
        $.prefix_expression,
        // $.hash_expression,
        $.field_get_expression,
        $.array_get_expression,
        // $.string_get_expression,
        // $.bigarray_get_expression,
        // $.coercion_expression,
        // $.local_open_expression,
        // $.package_expression,
        // $.new_expression,
        // $.object_copy_expression,
        // $.method_invocation,
        // $.object_expression,
        // $.parenthesized_expression,
        // $.ocamlyacc_value,
        // $._extension
      ),

    grouped_expression: ($) => seq("(", $.expression, ")"),
    unpack: ($) => prec.left(PREC.prefix, seq("...", $._simple_expression)),

    switch_expression: ($) =>
      seq("switch", "(", $.expression, ")", "{", repeat($._switch_case), "}"),

    _switch_case: ($) => seq("|", $._pattern, "=>", $.expression),

    _simple_pattern: ($) =>
      choice(
        $._value_pattern,
        $._signed_constant,
        // $.typed_pattern,
        $.constructor_path,
        $.tag,
        // $.polymorphic_variant_pattern,
        // $.record_pattern,
        // $.list_pattern,
        // $.array_pattern,
        // $.local_open_pattern,
        // $.package_pattern,
        // $.parenthesized_pattern,
        // $._extension
      ),

    _simple_value_pattern: ($) => alias($._identifier, $.value_pattern),

    _value_pattern: ($) =>
      choice($._simple_value_pattern /* , $.parenthesized_operator */),

    _pattern: ($) =>
      choice(
        $._simple_pattern,
        // $.alias_pattern,
        // $.or_pattern,
        $.constructor_pattern,
        // $.tag_pattern,
        // $.tuple_pattern,
        // $.cons_pattern,
        // $.range_pattern,
        // $.lazy_pattern,
        // $.exception_pattern
      ),

    // list_concat: ($) =>
    //   prec.left(PREC.concat, seq($.expression, "@", $.expression)),

    // Ocaml Overrides of basic types
    list_expression: ($) => seq("[", commaSep0($.expression), "]"),
    array_expression: ($) => seq("[|", commaSep0($.expression), "|]"),
    product_expression: ($) => seq("(", commaAtLeast1($.expression), ")"),

    // Built In Types
    array_get_expression: ($) =>
      prec.left(PREC.index, seq($.expression, "[", $.expression, "]")),

    record_expression: ($) =>
      seq(
        "{",
        optional(seq($.unpack, ",")),
        sep1(",", $.field_expression),
        optional(","),
        "}",
      ),

    field_expression: ($) =>
      prec.left(
        PREC.seq,
        seq(
          field("name", $.field_path),
          optional(seq(":", field("body", $._expression))),
        ),
      ),

    // record: ($) =>
    //   seq(
    //     "{",
    //     optional(seq($.unpack, optional(","))),
    //     commaSep0($.record_field),
    //     "}",
    //   ),
    // record_field: ($) => seq($.identifier, ":", $.expression),

    function_expression: ($) =>
      prec.right(
        PREC.app,
        seq(
          choice(seq("(", commaSep0($._parameter), ")"), $._parameter),
          optional(seq(":", $._type)),
          "=>",
          choice($.expression, $.block),
        ),
      ),

    // NOTE: Had more stuff in ocaml
    // choice(
    // alias($._parenthesized_abstract_type, $.abstract_type),
    // ),
    _parameter: ($) => $.parameter,

    parameter: ($) =>
      prec.right(
        PREC.prod,
        choice(
          seq($._identifier, optional($._typed)),
          seq("~", $._identifier, optional($._typed)),
          seq(
            "~",
            $._identifier,
            optional($._typed),
            "=",
            choice($.expression, "?"),
          ),
          // seq(
          //   choice('~', '?'),
          //   field('pattern', $._simple_value_pattern)
          // ),
          // seq(
          //   $._label,
          //   token.immediate(':'),
          //   field('pattern', $._simple_pattern)
          // ),
          // seq(
          //   choice('~', '?'),
          //   '(',
          //   field('pattern', $._simple_value_pattern),
          //   optional($._typed),
          //   optional(seq('=', $._sequence_expression)),
          //   ')'
          // ),
          // seq(
          //   $._label,
          //   token.immediate(':'),
          //   '(',
          //   field('pattern', $._pattern),
          //   optional($._typed),
          //   seq('=', $._sequence_expression),
          //   ')'
          // )
        ),
      ),

    // labeled_argument: ($) =>
    //   choice(
    //     seq("~", $._identifier, optional(seq(":", $.type_annotation))),
    //     seq(
    //       "~",
    //       $._identifier,
    //       optional(seq(":", $.type_annotation)),
    //       "=",
    //       choice($.expression, "?")
    //     )
    //   ),

    // _simple_expression: ($) => choice($.identifier),
    // choice(
    //   $.value_path,
    // $._constant,
    //   $.typed_expression,
    //   $.constructor_path,
    //   $.tag,
    //   $.list_expression,
    //   $.array_expression,
    //   $.record_expression,
    //   $.prefix_expression,
    //   $.hash_expression,
    //   $.field_get_expression,
    //   $.array_get_expression,
    //   $.string_get_expression,
    //   $.bigarray_get_expression,
    //   $.coercion_expression,
    //   $.local_open_expression,
    //   $.package_expression,
    //   $.new_expression,
    //   $.object_copy_expression,
    //   $.method_invocation,
    //   $.object_expression,
    //   $.parenthesized_expression,
    //   $.ocamlyacc_value,
    //   $._extension
    // ),

    // argument: ($) =>
    //   prec.left(
    //     1,
    //     choice(
    //       seq($._identifier, optional(seq(":", $.type_annotation))),
    //     )
    //   ),

    application_expression: ($) =>
      prec.left(
        PREC.app,
        seq(field("function", $.expression), "(", commaSep0($._argument), ")"),
      ),

    _label: ($) => seq("~", $._label_name),
    labeled_argument: ($) =>
      choice(
        $._label,
        seq($._label, token.immediate("="), $._simple_expression),
        // let print = (~prefix: option(string)=?, text) => text;
        seq("~", $._label_name, $._typed, "=", choice($.expression, "?")),
      ),

    variant_expression: ($) =>
      prec.right(
        choice(
          $.variant_identifier,
          seq($.variant_identifier, "(", commaSep1($.expression), ")"),
        ),
      ),

    variant_identifier: ($) => $._capitalized_identifier,

    if_expression: ($) =>
      seq(
        "if",
        "(",
        $.expression,
        ")",
        $.block,
        optional(seq("else", $.block)),
      ),

    block: ($) => prec.right(PREC.block, seq("{", repeat($._statement), "}")),

    ternary_expression: ($) =>
      prec.left(
        PREC.and,
        seq($.expression, "?", $.expression, ":", $.expression),
      ),

    str_operation: ($) => prec.left(1, seq($.expression, "++", $.expression)),

    _bool_operations: ($) =>
      choice(
        $.not_operation,
        $.bool_compare,
        $.bool_operation,
        $.reference_equality,
        $.structural_equality,
      ),

    not_operation: ($) => seq("!", $.expression),

    bool_compare: ($) =>
      prec.left(
        1,
        seq($.expression, choice("<", ">", "<=", ">="), $.expression),
      ),

    bool_operation: ($) =>
      prec.left(2, seq($.expression, choice("&&", "||"), $.expression)),

    reference_equality: ($) =>
      prec.left(3, seq($.expression, choice("===", "!=="), $.expression)),

    structural_equality: ($) =>
      prec.left(3, seq($.expression, choice("==", "!="), $.expression)),

    // type_binding: ($) =>
    //   seq("type", $.type_declaration, "=", $.type_annotation, ";"),

    type_definition: ($) =>
      seq(
        "type",
        // optional($._attribute),
        optional("nonrec"),
        $.type_binding,
        $._semicolon,
      ),

    _type: ($) =>
      choice($._tuple_type, $.function_type, $.aliased_type, $.type_nested),

    type_nested: ($) =>
      prec.right(PREC.app, seq($._type, "(", commaSep1($._type), ")")),

    type_binding: ($) =>
      seq(
        optional($._type_params),
        choice($._type_binding, $._extensible_type_binding),
        repeat($.item_attribute),
      ),

    _type_identifier: ($) =>
      alias(choice($._identifier, seq("'", $._identifier)), $.type_constructor),

    _type_constructor: ($) =>
      prec.left(
        PREC.app,
        seq(
          $._type_identifier,
          optional(seq("(", commaSep1($._type_identifier), ")")),
        ),
      ),

    _type_binding: ($) =>
      seq(
        field("name", $._type_constructor),
        optional($._type_equation),
        optional(
          seq(
            "=",
            optional("private"),
            field(
              "body",
              choice($.variant_declaration, $.record_declaration, ".."),
            ),
          ),
        ),
        repeat($.type_constraint),
      ),

    function_type: ($) =>
      prec.right(PREC.match, seq("(", commaSep1($._type), ")", "=>", $._type)),

    record_declaration: ($) =>
      seq("{", sep1(",", $.field_declaration), optional(","), "}"),

    // typed_label: ($) =>
    //   prec.left(PREC.seq, seq("~", $._label_name, ":", $._type)),

    _extensible_type_binding: ($) =>
      seq(
        field("name", $.type_constructor_path),
        seq("+=", optional("private"), field("body", $.variant_declaration)),
      ),

    constructor_declaration: ($) =>
      seq(
        choice(
          $._constructor_name,
          // alias(
          //   choice(seq("[", "]"), seq("(", ")"), "true", "false"),
          //   $.constructor_name,
          // ),
        ),
        optional(
          choice(
            seq("(", commaSep1($._constructor_argument), ")"),
            // seq(
            //   ":",
            //   optional(seq(repeat1($.type_variable), ".")),
            //   optional(seq($._constructor_argument, "->")),
            //   $._simple_type,
            // ),
            // seq("=", $.constructor_path),
          ),
        ),
      ),

    _constructor_name: ($) =>
      alias($._capitalized_identifier, $.constructor_name),

    // type_declaration: ($) => choice($.type_identifier, $.type_nested),
    // type_variant: ($) => repeat1(seq("|", $.type_variant_constructor)),
    //   prec.right(
    //     PREC.app,
    //     choice(
    //       $.type_variant_identifier,
    //       seq(
    //         $.type_variant_identifier,
    //         "(",
    //         commaSep1($.type_annotation),
    //         ")",
    //       ),
    //     ),
    //   ),
    // type_variant_identifier: ($) => /[A-Z][a-zA-Z0-9_]*/,

    // OCAML: tuple_type: ($) => prec(PREC.prod, seq($._tuple_type, "*", $._simple_type)),
    tuple_type: ($) => prec(PREC.prod, seq("(", commaSep1($._type), ")")),

    identifier: ($) => $._identifier,

    // Copied from JS
    // http://stackoverflow.com/questions/13014947/regex-to-match-a-c-style-multiline-comment/36328890#36328890
    comment: ($) =>
      choice(
        token(
          choice(seq("//", /.*/), seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/")),
        ),
      ),

    _semicolon: ($) => choice(";", $._automatic_semicolon),

    // JSX {{{
    _jsx_element: ($) => choice($.jsx_element, $.jsx_self_closing_element),

    jsx_element: ($) =>
      seq(
        field("open_tag", $.jsx_opening_element),
        repeat($._jsx_child),
        field("close_tag", $.jsx_closing_element),
      ),

    _jsx_child: ($) =>
      choice(
        $.html_character_reference,
        $._jsx_element,
        $.jsx_expression,
        $.unpack,
      ),

    jsx_opening_element: ($) =>
      prec.dynamic(
        -1,
        seq(
          "<",
          optional(
            seq(
              field("name", $._jsx_element_name),
              repeat(field("attribute", $._jsx_attribute)),
            ),
          ),
          ">",
        ),
      ),

    jsx_closing_element: ($) =>
      seq("</", optional(field("name", $._jsx_element_name)), ">"),

    jsx_self_closing_element: ($) =>
      seq(
        "<",
        field("name", $._jsx_element_name),
        repeat(field("attribute", $._jsx_attribute)),
        "/>",
      ),

    _jsx_attribute: ($) => choice($.jsx_attribute, $.jsx_expression),
    _jsx_attribute_name: ($) => alias($._jsx_identifier, $.property_identifier),

    jsx_expression: ($) =>
      prec.left(
        PREC.app,
        choice(seq("{", optional($.expression), "}"), $._value_name, $.tag),
      ),

    jsx_attribute: ($) =>
      seq(
        $._jsx_attribute_name,
        optional(seq("=", optional("?"), $._jsx_attribute_value)),
      ),

    // An entity can be named, numeric (decimal), or numeric (hexadecimal). The
    // longest entity name is 29 characters long, and the HTML spec says that
    // no more will ever be added.
    html_character_reference: (_) =>
      /&(#([xX][0-9a-fA-F]{1,6}|[0-9]{1,5})|[A-Za-z]{1,30});/,

    jsx_identifier: (_) =>
      prec.right(/[a-zA-Z_$][a-zA-Z\d_$]*-[a-zA-Z\d_$\-]*/),

    _jsx_identifier: ($) =>
      alias(
        choice($.jsx_identifier, $._identifier, $._capitalized_identifier),
        $.identifier,
      ),

    _jsx_element_name: ($) =>
      choice(
        $._jsx_identifier,
        // alias($.nested_identifier, $.member_expression),
      ),

    _jsx_attribute_value: ($) =>
      choice(
        /* alias($._jsx_string, $.string) ,*/
        $.jsx_expression,
        $._jsx_element,
        $.string,
        $.number,
      ),

    // }}}
  },
});

function commaSep0(rule, no_trailing) {
  return no_trailing
    ? optional(seq(rule, repeat(seq(",", rule))))
    : optional(seq(rule, repeat(seq(",", rule)), optional(",")));
}

function commaSep1(rule) {
  return seq(rule, repeat(seq(",", rule)), optional(","));
}

function commaAtLeast1(rule) {
  return seq(rule, repeat1(seq(",", rule)), optional(","));
}

function parenthesize(rule) {
  return seq("(", rule, ")");
}

function path(prefix, final) {
  return choice(final, seq(prefix, ".", final));
}

function sep1(delimiter, rule) {
  return seq(rule, repeat(seq(delimiter, rule)));
}
