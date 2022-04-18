/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */
/*
 * THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.
 * Generated by fluid-type-validator in @fluidframework/build-tools.
 */
/* eslint-disable max-lines */
import * as old from "@fluidframework/shared-summary-block-previous";
import * as current from "../../index";

type TypeOnly<T> = {
    [P in keyof T]: TypeOnly<T[P]>;
};

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken:
* "InterfaceDeclaration_ISharedSummaryBlock": {"forwardCompat": false}
*/
declare function get_old_InterfaceDeclaration_ISharedSummaryBlock():
    TypeOnly<old.ISharedSummaryBlock>;
declare function use_current_InterfaceDeclaration_ISharedSummaryBlock(
    use: TypeOnly<current.ISharedSummaryBlock>);
use_current_InterfaceDeclaration_ISharedSummaryBlock(
    get_old_InterfaceDeclaration_ISharedSummaryBlock());

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken:
* "InterfaceDeclaration_ISharedSummaryBlock": {"backCompat": false}
*/
declare function get_current_InterfaceDeclaration_ISharedSummaryBlock():
    TypeOnly<current.ISharedSummaryBlock>;
declare function use_old_InterfaceDeclaration_ISharedSummaryBlock(
    use: TypeOnly<old.ISharedSummaryBlock>);
use_old_InterfaceDeclaration_ISharedSummaryBlock(
    get_current_InterfaceDeclaration_ISharedSummaryBlock());

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken:
* "ClassDeclaration_SharedSummaryBlock": {"forwardCompat": false}
*/
declare function get_old_ClassDeclaration_SharedSummaryBlock():
    TypeOnly<old.SharedSummaryBlock>;
declare function use_current_ClassDeclaration_SharedSummaryBlock(
    use: TypeOnly<current.SharedSummaryBlock>);
use_current_ClassDeclaration_SharedSummaryBlock(
    get_old_ClassDeclaration_SharedSummaryBlock());

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken:
* "ClassDeclaration_SharedSummaryBlock": {"backCompat": false}
*/
declare function get_current_ClassDeclaration_SharedSummaryBlock():
    TypeOnly<current.SharedSummaryBlock>;
declare function use_old_ClassDeclaration_SharedSummaryBlock(
    use: TypeOnly<old.SharedSummaryBlock>);
use_old_ClassDeclaration_SharedSummaryBlock(
    get_current_ClassDeclaration_SharedSummaryBlock());

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken:
* "ClassDeclaration_SharedSummaryBlockFactory": {"forwardCompat": false}
*/
declare function get_old_ClassDeclaration_SharedSummaryBlockFactory():
    TypeOnly<old.SharedSummaryBlockFactory>;
declare function use_current_ClassDeclaration_SharedSummaryBlockFactory(
    use: TypeOnly<current.SharedSummaryBlockFactory>);
use_current_ClassDeclaration_SharedSummaryBlockFactory(
    get_old_ClassDeclaration_SharedSummaryBlockFactory());

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken:
* "ClassDeclaration_SharedSummaryBlockFactory": {"backCompat": false}
*/
declare function get_current_ClassDeclaration_SharedSummaryBlockFactory():
    TypeOnly<current.SharedSummaryBlockFactory>;
declare function use_old_ClassDeclaration_SharedSummaryBlockFactory(
    use: TypeOnly<old.SharedSummaryBlockFactory>);
use_old_ClassDeclaration_SharedSummaryBlockFactory(
    get_current_ClassDeclaration_SharedSummaryBlockFactory());
