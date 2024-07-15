/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

/*
 * THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.
 * Generated by flub generate:typetests in @fluid-tools/build-cli.
 */

import type { TypeOnly, MinimalType, FullType, requireAssignableTo } from "@fluidframework/build-tools";
import type * as old from "@fluidframework/tinylicious-client-previous/internal";

import type * as current from "../../index.js";

declare type MakeUnusedImportErrorsGoAway<T> = TypeOnly<T> | MinimalType<T> | FullType<T> | typeof old | typeof current | requireAssignableTo<true, true>;

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "TypeAliasDeclaration_CompatibilityMode": {"forwardCompat": false}
 */
declare type old_as_current_for_TypeAliasDeclaration_CompatibilityMode = requireAssignableTo<TypeOnly<old.CompatibilityMode>, TypeOnly<current.CompatibilityMode>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "TypeAliasDeclaration_CompatibilityMode": {"backCompat": false}
 */
declare type current_as_old_for_TypeAliasDeclaration_CompatibilityMode = requireAssignableTo<TypeOnly<current.CompatibilityMode>, TypeOnly<old.CompatibilityMode>>

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "TypeAliasDeclaration_ITinyliciousAudience": {"forwardCompat": false}
 */
declare type old_as_current_for_TypeAliasDeclaration_ITinyliciousAudience = requireAssignableTo<TypeOnly<old.ITinyliciousAudience>, TypeOnly<current.ITinyliciousAudience>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "TypeAliasDeclaration_ITinyliciousAudience": {"backCompat": false}
 */
declare type current_as_old_for_TypeAliasDeclaration_ITinyliciousAudience = requireAssignableTo<TypeOnly<current.ITinyliciousAudience>, TypeOnly<old.ITinyliciousAudience>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassDeclaration_TinyliciousClient": {"backCompat": false}
 */
declare type current_as_old_for_ClassDeclaration_TinyliciousClient = requireAssignableTo<TypeOnly<current.TinyliciousClient>, TypeOnly<old.TinyliciousClient>>

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "InterfaceDeclaration_TinyliciousClientProps": {"forwardCompat": false}
 */
declare type old_as_current_for_InterfaceDeclaration_TinyliciousClientProps = requireAssignableTo<TypeOnly<old.TinyliciousClientProps>, TypeOnly<current.TinyliciousClientProps>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "InterfaceDeclaration_TinyliciousClientProps": {"backCompat": false}
 */
declare type current_as_old_for_InterfaceDeclaration_TinyliciousClientProps = requireAssignableTo<TypeOnly<current.TinyliciousClientProps>, TypeOnly<old.TinyliciousClientProps>>

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "InterfaceDeclaration_TinyliciousConnectionConfig": {"forwardCompat": false}
 */
declare type old_as_current_for_InterfaceDeclaration_TinyliciousConnectionConfig = requireAssignableTo<TypeOnly<old.TinyliciousConnectionConfig>, TypeOnly<current.TinyliciousConnectionConfig>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "InterfaceDeclaration_TinyliciousConnectionConfig": {"backCompat": false}
 */
declare type current_as_old_for_InterfaceDeclaration_TinyliciousConnectionConfig = requireAssignableTo<TypeOnly<current.TinyliciousConnectionConfig>, TypeOnly<old.TinyliciousConnectionConfig>>

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "InterfaceDeclaration_TinyliciousContainerServices": {"forwardCompat": false}
 */
declare type old_as_current_for_InterfaceDeclaration_TinyliciousContainerServices = requireAssignableTo<TypeOnly<old.TinyliciousContainerServices>, TypeOnly<current.TinyliciousContainerServices>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "InterfaceDeclaration_TinyliciousContainerServices": {"backCompat": false}
 */
declare type current_as_old_for_InterfaceDeclaration_TinyliciousContainerServices = requireAssignableTo<TypeOnly<current.TinyliciousContainerServices>, TypeOnly<old.TinyliciousContainerServices>>

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "InterfaceDeclaration_TinyliciousMember": {"forwardCompat": false}
 */
declare type old_as_current_for_InterfaceDeclaration_TinyliciousMember = requireAssignableTo<TypeOnly<old.TinyliciousMember>, TypeOnly<current.TinyliciousMember>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "InterfaceDeclaration_TinyliciousMember": {"backCompat": false}
 */
declare type current_as_old_for_InterfaceDeclaration_TinyliciousMember = requireAssignableTo<TypeOnly<current.TinyliciousMember>, TypeOnly<old.TinyliciousMember>>

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "InterfaceDeclaration_TinyliciousUser": {"forwardCompat": false}
 */
declare type old_as_current_for_InterfaceDeclaration_TinyliciousUser = requireAssignableTo<TypeOnly<old.TinyliciousUser>, TypeOnly<current.TinyliciousUser>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "InterfaceDeclaration_TinyliciousUser": {"backCompat": false}
 */
declare type current_as_old_for_InterfaceDeclaration_TinyliciousUser = requireAssignableTo<TypeOnly<current.TinyliciousUser>, TypeOnly<old.TinyliciousUser>>
