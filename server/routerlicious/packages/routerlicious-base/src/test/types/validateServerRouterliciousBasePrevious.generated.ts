/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

/*
 * THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.
 * Generated by flub generate:typetests in @fluid-tools/build-cli.
 */

import type { TypeOnly, MinimalType, FullType, requireAssignableTo } from "@fluidframework/build-tools";
import type * as old from "@fluidframework/server-routerlicious-base-previous";

import type * as current from "../../index.js";

declare type MakeUnusedImportErrorsGoAway<T> = TypeOnly<T> | MinimalType<T> | FullType<T> | typeof old | typeof current | requireAssignableTo<true, true>;

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Class_AlfredResources": {"forwardCompat": false}
 */
// @ts-expect-error compatibility expected to be broken
declare type old_as_current_for_Class_AlfredResources = requireAssignableTo<TypeOnly<old.AlfredResources>, TypeOnly<current.AlfredResources>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Class_AlfredResources": {"backCompat": false}
 */
declare type current_as_old_for_Class_AlfredResources = requireAssignableTo<TypeOnly<current.AlfredResources>, TypeOnly<old.AlfredResources>>

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Class_AlfredResourcesFactory": {"forwardCompat": false}
 */
declare type old_as_current_for_Class_AlfredResourcesFactory = requireAssignableTo<TypeOnly<old.AlfredResourcesFactory>, TypeOnly<current.AlfredResourcesFactory>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Class_AlfredResourcesFactory": {"backCompat": false}
 */
declare type current_as_old_for_Class_AlfredResourcesFactory = requireAssignableTo<TypeOnly<current.AlfredResourcesFactory>, TypeOnly<old.AlfredResourcesFactory>>

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Class_AlfredRunner": {"forwardCompat": false}
 */
declare type old_as_current_for_Class_AlfredRunner = requireAssignableTo<TypeOnly<old.AlfredRunner>, TypeOnly<current.AlfredRunner>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Class_AlfredRunner": {"backCompat": false}
 */
declare type current_as_old_for_Class_AlfredRunner = requireAssignableTo<TypeOnly<current.AlfredRunner>, TypeOnly<old.AlfredRunner>>

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Class_AlfredRunnerFactory": {"forwardCompat": false}
 */
declare type old_as_current_for_Class_AlfredRunnerFactory = requireAssignableTo<TypeOnly<old.AlfredRunnerFactory>, TypeOnly<current.AlfredRunnerFactory>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Class_AlfredRunnerFactory": {"backCompat": false}
 */
declare type current_as_old_for_Class_AlfredRunnerFactory = requireAssignableTo<TypeOnly<current.AlfredRunnerFactory>, TypeOnly<old.AlfredRunnerFactory>>

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Class_DeltaService": {"forwardCompat": false}
 */
declare type old_as_current_for_Class_DeltaService = requireAssignableTo<TypeOnly<old.DeltaService>, TypeOnly<current.DeltaService>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Class_DeltaService": {"backCompat": false}
 */
declare type current_as_old_for_Class_DeltaService = requireAssignableTo<TypeOnly<current.DeltaService>, TypeOnly<old.DeltaService>>

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Class_DocumentDeleteService": {"forwardCompat": false}
 */
declare type old_as_current_for_Class_DocumentDeleteService = requireAssignableTo<TypeOnly<old.DocumentDeleteService>, TypeOnly<current.DocumentDeleteService>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Class_DocumentDeleteService": {"backCompat": false}
 */
declare type current_as_old_for_Class_DocumentDeleteService = requireAssignableTo<TypeOnly<current.DocumentDeleteService>, TypeOnly<old.DocumentDeleteService>>

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Class_MongoTenantRepository": {"forwardCompat": false}
 */
declare type old_as_current_for_Class_MongoTenantRepository = requireAssignableTo<TypeOnly<old.MongoTenantRepository>, TypeOnly<current.MongoTenantRepository>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Class_MongoTenantRepository": {"backCompat": false}
 */
declare type current_as_old_for_Class_MongoTenantRepository = requireAssignableTo<TypeOnly<current.MongoTenantRepository>, TypeOnly<old.MongoTenantRepository>>

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Class_NexusResources": {"forwardCompat": false}
 */
// @ts-expect-error compatibility expected to be broken
declare type old_as_current_for_Class_NexusResources = requireAssignableTo<TypeOnly<old.NexusResources>, TypeOnly<current.NexusResources>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Class_NexusResources": {"backCompat": false}
 */
declare type current_as_old_for_Class_NexusResources = requireAssignableTo<TypeOnly<current.NexusResources>, TypeOnly<old.NexusResources>>

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Class_NexusResourcesFactory": {"forwardCompat": false}
 */
declare type old_as_current_for_Class_NexusResourcesFactory = requireAssignableTo<TypeOnly<old.NexusResourcesFactory>, TypeOnly<current.NexusResourcesFactory>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Class_NexusResourcesFactory": {"backCompat": false}
 */
declare type current_as_old_for_Class_NexusResourcesFactory = requireAssignableTo<TypeOnly<current.NexusResourcesFactory>, TypeOnly<old.NexusResourcesFactory>>

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Class_NexusRunnerFactory": {"forwardCompat": false}
 */
declare type old_as_current_for_Class_NexusRunnerFactory = requireAssignableTo<TypeOnly<old.NexusRunnerFactory>, TypeOnly<current.NexusRunnerFactory>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Class_NexusRunnerFactory": {"backCompat": false}
 */
declare type current_as_old_for_Class_NexusRunnerFactory = requireAssignableTo<TypeOnly<current.NexusRunnerFactory>, TypeOnly<old.NexusRunnerFactory>>

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Class_OrdererManager": {"forwardCompat": false}
 */
// @ts-expect-error compatibility expected to be broken
declare type old_as_current_for_Class_OrdererManager = requireAssignableTo<TypeOnly<old.OrdererManager>, TypeOnly<current.OrdererManager>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Class_OrdererManager": {"backCompat": false}
 */
declare type current_as_old_for_Class_OrdererManager = requireAssignableTo<TypeOnly<current.OrdererManager>, TypeOnly<old.OrdererManager>>

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Class_OrderingResourcesFactory": {"forwardCompat": false}
 */
declare type old_as_current_for_Class_OrderingResourcesFactory = requireAssignableTo<TypeOnly<old.OrderingResourcesFactory>, TypeOnly<current.OrderingResourcesFactory>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Class_OrderingResourcesFactory": {"backCompat": false}
 */
declare type current_as_old_for_Class_OrderingResourcesFactory = requireAssignableTo<TypeOnly<current.OrderingResourcesFactory>, TypeOnly<old.OrderingResourcesFactory>>

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Class_RiddlerResources": {"forwardCompat": false}
 */
// @ts-expect-error compatibility expected to be broken
declare type old_as_current_for_Class_RiddlerResources = requireAssignableTo<TypeOnly<old.RiddlerResources>, TypeOnly<current.RiddlerResources>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Class_RiddlerResources": {"backCompat": false}
 */
// @ts-expect-error compatibility expected to be broken
declare type current_as_old_for_Class_RiddlerResources = requireAssignableTo<TypeOnly<current.RiddlerResources>, TypeOnly<old.RiddlerResources>>

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Class_RiddlerResourcesFactory": {"forwardCompat": false}
 */
declare type old_as_current_for_Class_RiddlerResourcesFactory = requireAssignableTo<TypeOnly<old.RiddlerResourcesFactory>, TypeOnly<current.RiddlerResourcesFactory>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Class_RiddlerResourcesFactory": {"backCompat": false}
 */
declare type current_as_old_for_Class_RiddlerResourcesFactory = requireAssignableTo<TypeOnly<current.RiddlerResourcesFactory>, TypeOnly<old.RiddlerResourcesFactory>>

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Class_RiddlerRunner": {"forwardCompat": false}
 */
declare type old_as_current_for_Class_RiddlerRunner = requireAssignableTo<TypeOnly<old.RiddlerRunner>, TypeOnly<current.RiddlerRunner>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Class_RiddlerRunner": {"backCompat": false}
 */
declare type current_as_old_for_Class_RiddlerRunner = requireAssignableTo<TypeOnly<current.RiddlerRunner>, TypeOnly<old.RiddlerRunner>>

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Class_RiddlerRunnerFactory": {"forwardCompat": false}
 */
declare type old_as_current_for_Class_RiddlerRunnerFactory = requireAssignableTo<TypeOnly<old.RiddlerRunnerFactory>, TypeOnly<current.RiddlerRunnerFactory>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Class_RiddlerRunnerFactory": {"backCompat": false}
 */
declare type current_as_old_for_Class_RiddlerRunnerFactory = requireAssignableTo<TypeOnly<current.RiddlerRunnerFactory>, TypeOnly<old.RiddlerRunnerFactory>>

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Class_TenantManager": {"forwardCompat": false}
 */
// @ts-expect-error compatibility expected to be broken
declare type old_as_current_for_Class_TenantManager = requireAssignableTo<TypeOnly<old.TenantManager>, TypeOnly<current.TenantManager>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Class_TenantManager": {"backCompat": false}
 */
declare type current_as_old_for_Class_TenantManager = requireAssignableTo<TypeOnly<current.TenantManager>, TypeOnly<old.TenantManager>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassStatics_AlfredResources": {"backCompat": false}
 */
declare type current_as_old_for_ClassStatics_AlfredResources = requireAssignableTo<TypeOnly<typeof current.AlfredResources>, TypeOnly<typeof old.AlfredResources>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassStatics_AlfredResourcesFactory": {"backCompat": false}
 */
declare type current_as_old_for_ClassStatics_AlfredResourcesFactory = requireAssignableTo<TypeOnly<typeof current.AlfredResourcesFactory>, TypeOnly<typeof old.AlfredResourcesFactory>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassStatics_AlfredRunner": {"backCompat": false}
 */
declare type current_as_old_for_ClassStatics_AlfredRunner = requireAssignableTo<TypeOnly<typeof current.AlfredRunner>, TypeOnly<typeof old.AlfredRunner>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassStatics_AlfredRunnerFactory": {"backCompat": false}
 */
declare type current_as_old_for_ClassStatics_AlfredRunnerFactory = requireAssignableTo<TypeOnly<typeof current.AlfredRunnerFactory>, TypeOnly<typeof old.AlfredRunnerFactory>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassStatics_DeltaService": {"backCompat": false}
 */
declare type current_as_old_for_ClassStatics_DeltaService = requireAssignableTo<TypeOnly<typeof current.DeltaService>, TypeOnly<typeof old.DeltaService>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassStatics_DocumentDeleteService": {"backCompat": false}
 */
declare type current_as_old_for_ClassStatics_DocumentDeleteService = requireAssignableTo<TypeOnly<typeof current.DocumentDeleteService>, TypeOnly<typeof old.DocumentDeleteService>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassStatics_MongoTenantRepository": {"backCompat": false}
 */
declare type current_as_old_for_ClassStatics_MongoTenantRepository = requireAssignableTo<TypeOnly<typeof current.MongoTenantRepository>, TypeOnly<typeof old.MongoTenantRepository>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassStatics_NexusResources": {"backCompat": false}
 */
declare type current_as_old_for_ClassStatics_NexusResources = requireAssignableTo<TypeOnly<typeof current.NexusResources>, TypeOnly<typeof old.NexusResources>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassStatics_NexusResourcesFactory": {"backCompat": false}
 */
declare type current_as_old_for_ClassStatics_NexusResourcesFactory = requireAssignableTo<TypeOnly<typeof current.NexusResourcesFactory>, TypeOnly<typeof old.NexusResourcesFactory>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassStatics_NexusRunnerFactory": {"backCompat": false}
 */
declare type current_as_old_for_ClassStatics_NexusRunnerFactory = requireAssignableTo<TypeOnly<typeof current.NexusRunnerFactory>, TypeOnly<typeof old.NexusRunnerFactory>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassStatics_OrdererManager": {"backCompat": false}
 */
declare type current_as_old_for_ClassStatics_OrdererManager = requireAssignableTo<TypeOnly<typeof current.OrdererManager>, TypeOnly<typeof old.OrdererManager>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassStatics_OrderingResourcesFactory": {"backCompat": false}
 */
declare type current_as_old_for_ClassStatics_OrderingResourcesFactory = requireAssignableTo<TypeOnly<typeof current.OrderingResourcesFactory>, TypeOnly<typeof old.OrderingResourcesFactory>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassStatics_RiddlerResources": {"backCompat": false}
 */
// @ts-expect-error compatibility expected to be broken
declare type current_as_old_for_ClassStatics_RiddlerResources = requireAssignableTo<TypeOnly<typeof current.RiddlerResources>, TypeOnly<typeof old.RiddlerResources>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassStatics_RiddlerResourcesFactory": {"backCompat": false}
 */
declare type current_as_old_for_ClassStatics_RiddlerResourcesFactory = requireAssignableTo<TypeOnly<typeof current.RiddlerResourcesFactory>, TypeOnly<typeof old.RiddlerResourcesFactory>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassStatics_RiddlerRunner": {"backCompat": false}
 */
declare type current_as_old_for_ClassStatics_RiddlerRunner = requireAssignableTo<TypeOnly<typeof current.RiddlerRunner>, TypeOnly<typeof old.RiddlerRunner>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassStatics_RiddlerRunnerFactory": {"backCompat": false}
 */
declare type current_as_old_for_ClassStatics_RiddlerRunnerFactory = requireAssignableTo<TypeOnly<typeof current.RiddlerRunnerFactory>, TypeOnly<typeof old.RiddlerRunnerFactory>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassStatics_TenantManager": {"backCompat": false}
 */
declare type current_as_old_for_ClassStatics_TenantManager = requireAssignableTo<TypeOnly<typeof current.TenantManager>, TypeOnly<typeof old.TenantManager>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Function_createDocumentRouter": {"backCompat": false}
 */
declare type current_as_old_for_Function_createDocumentRouter = requireAssignableTo<TypeOnly<typeof current.createDocumentRouter>, TypeOnly<typeof old.createDocumentRouter>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Function_getSession": {"backCompat": false}
 */
declare type current_as_old_for_Function_getSession = requireAssignableTo<TypeOnly<typeof current.getSession>, TypeOnly<typeof old.getSession>>

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Interface_IAlfredResourcesCustomizations": {"forwardCompat": false}
 */
declare type old_as_current_for_Interface_IAlfredResourcesCustomizations = requireAssignableTo<TypeOnly<old.IAlfredResourcesCustomizations>, TypeOnly<current.IAlfredResourcesCustomizations>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Interface_IAlfredResourcesCustomizations": {"backCompat": false}
 */
declare type current_as_old_for_Interface_IAlfredResourcesCustomizations = requireAssignableTo<TypeOnly<current.IAlfredResourcesCustomizations>, TypeOnly<old.IAlfredResourcesCustomizations>>

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Interface_IDocumentDeleteService": {"forwardCompat": false}
 */
declare type old_as_current_for_Interface_IDocumentDeleteService = requireAssignableTo<TypeOnly<old.IDocumentDeleteService>, TypeOnly<current.IDocumentDeleteService>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Interface_IDocumentDeleteService": {"backCompat": false}
 */
declare type current_as_old_for_Interface_IDocumentDeleteService = requireAssignableTo<TypeOnly<current.IDocumentDeleteService>, TypeOnly<old.IDocumentDeleteService>>

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Interface_INexusResourcesCustomizations": {"forwardCompat": false}
 */
declare type old_as_current_for_Interface_INexusResourcesCustomizations = requireAssignableTo<TypeOnly<old.INexusResourcesCustomizations>, TypeOnly<current.INexusResourcesCustomizations>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Interface_INexusResourcesCustomizations": {"backCompat": false}
 */
declare type current_as_old_for_Interface_INexusResourcesCustomizations = requireAssignableTo<TypeOnly<current.INexusResourcesCustomizations>, TypeOnly<old.INexusResourcesCustomizations>>

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Interface_IPlugin": {"forwardCompat": false}
 */
declare type old_as_current_for_Interface_IPlugin = requireAssignableTo<TypeOnly<old.IPlugin>, TypeOnly<current.IPlugin>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Interface_IPlugin": {"backCompat": false}
 */
declare type current_as_old_for_Interface_IPlugin = requireAssignableTo<TypeOnly<current.IPlugin>, TypeOnly<old.IPlugin>>

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Interface_IRiddlerResourcesCustomizations": {"forwardCompat": false}
 */
declare type old_as_current_for_Interface_IRiddlerResourcesCustomizations = requireAssignableTo<TypeOnly<old.IRiddlerResourcesCustomizations>, TypeOnly<current.IRiddlerResourcesCustomizations>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Interface_IRiddlerResourcesCustomizations": {"backCompat": false}
 */
declare type current_as_old_for_Interface_IRiddlerResourcesCustomizations = requireAssignableTo<TypeOnly<current.IRiddlerResourcesCustomizations>, TypeOnly<old.IRiddlerResourcesCustomizations>>

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Interface_ITenantDocument": {"forwardCompat": false}
 */
declare type old_as_current_for_Interface_ITenantDocument = requireAssignableTo<TypeOnly<old.ITenantDocument>, TypeOnly<current.ITenantDocument>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Interface_ITenantDocument": {"backCompat": false}
 */
// @ts-expect-error compatibility expected to be broken
declare type current_as_old_for_Interface_ITenantDocument = requireAssignableTo<TypeOnly<current.ITenantDocument>, TypeOnly<old.ITenantDocument>>

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Interface_ITenantRepository": {"forwardCompat": false}
 */
declare type old_as_current_for_Interface_ITenantRepository = requireAssignableTo<TypeOnly<old.ITenantRepository>, TypeOnly<current.ITenantRepository>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Interface_ITenantRepository": {"backCompat": false}
 */
declare type current_as_old_for_Interface_ITenantRepository = requireAssignableTo<TypeOnly<current.ITenantRepository>, TypeOnly<old.ITenantRepository>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Variable_catch404": {"backCompat": false}
 */
declare type current_as_old_for_Variable_catch404 = requireAssignableTo<TypeOnly<typeof current.catch404>, TypeOnly<typeof old.catch404>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Variable_Constants": {"backCompat": false}
 */
declare type current_as_old_for_Variable_Constants = requireAssignableTo<TypeOnly<typeof current.Constants>, TypeOnly<typeof old.Constants>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Variable_getIdFromRequest": {"backCompat": false}
 */
declare type current_as_old_for_Variable_getIdFromRequest = requireAssignableTo<TypeOnly<typeof current.getIdFromRequest>, TypeOnly<typeof old.getIdFromRequest>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Variable_getTenantIdFromRequest": {"backCompat": false}
 */
declare type current_as_old_for_Variable_getTenantIdFromRequest = requireAssignableTo<TypeOnly<typeof current.getTenantIdFromRequest>, TypeOnly<typeof old.getTenantIdFromRequest>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Variable_handleError": {"backCompat": false}
 */
declare type current_as_old_for_Variable_handleError = requireAssignableTo<TypeOnly<typeof current.handleError>, TypeOnly<typeof old.handleError>>
