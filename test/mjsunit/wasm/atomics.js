// Copyright 2017 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Flags: --experimental-wasm-threads

load("test/mjsunit/wasm/wasm-constants.js");
load("test/mjsunit/wasm/wasm-module-builder.js");

function VerifyBoundsCheck(buffer, funcs, max) {
  kPageSize = 65536;
  // Test out of bounds at boundary
  for (j = 0; j < funcs.length; j++) {
    for (i = buffer.byteLength - funcs[j].memtype_size + 1;
         i < buffer.byteLength + funcs[j].memtype_size + 4; i++) {
      assertTraps(kTrapMemOutOfBounds, () => funcs[j].func(i, 5));
    }
    // Test out of bounds at maximum + 1
    assertTraps(kTrapMemOutOfBounds, () =>
        funcs[j].func((max + 1) * kPageSize, 5));
  }
}

(function TestAtomicAdd() {
  print("TestAtomicAdd");
  let memory = new WebAssembly.Memory({initial: 1, maximum: 10, shared: true});
  let builder = new WasmModuleBuilder();
  builder.addImportedMemory("m", "imported_mem");
  builder.addFunction("atomic_add", kSig_i_ii)
    .addBody([
      kExprGetLocal, 0,
      kExprGetLocal, 1,
      kAtomicPrefix,
      kExprI32AtomicAdd])
    .exportAs("atomic_add");
  builder.addFunction("atomic_add16", kSig_i_ii)
    .addBody([
      kExprGetLocal, 0,
      kExprGetLocal, 1,
      kAtomicPrefix,
      kExprI32AtomicAdd16U])
    .exportAs("atomic_add16");
  builder.addFunction("atomic_add8", kSig_i_ii)
    .addBody([
      kExprGetLocal, 0,
      kExprGetLocal, 1,
      kAtomicPrefix,
      kExprI32AtomicAdd8U])
    .exportAs("atomic_add8");

  // Instantiate module, get function exports
  let module = new WebAssembly.Module(builder.toBuffer());
  let instance = (new WebAssembly.Instance(module,
        {m: {imported_mem: memory}}));

  // 32-bit Add
  let i32 = new Uint32Array(memory.buffer);
  for (i = 0; i < i32.length; i++) {
    i32[i] = i;
    assertEquals(i, instance.exports.atomic_add(i * 4, 0xACEDACED));
    assertEquals(i + 0xACEDACED, i32[i]);
  }

  // 16-bit Add
  let i16 = new Uint16Array(memory.buffer);
  for (i = 0; i < i16.length; i++) {
    i16[i] = i;
    assertEquals(i, instance.exports.atomic_add16(i * 2, 0x1234));
    assertEquals(i + 0x1234, i16[i]);
  }

  // 8-bit Add
  let i8 = new Uint8Array(memory.buffer);
  for (i = 0; i < i8.length; i++) {
    i8[i] = 0x11;
    assertEquals(0x11, instance.exports.atomic_add8(i, 0xee));
    assertEquals(0x11 + 0xee, i8[i]);
  }

  var adds = [{func: instance.exports.atomic_add, memtype_size: 4},
  {func: instance.exports.atomic_add16, memtype_size: 2},
  {func: instance.exports.atomic_add8, memtype_size: 1}];

  VerifyBoundsCheck(memory.buffer, adds, 10);
})();

(function TestAtomicSub() {
  print("TestAtomicSub");
  let memory = new WebAssembly.Memory({initial: 5, maximum: 20, shared: true});
  let builder = new WasmModuleBuilder();
  builder.addImportedMemory("m", "imported_mem");
  builder.addFunction("atomic_sub", kSig_i_ii)
    .addBody([
      kExprGetLocal, 0,
      kExprGetLocal, 1,
      kAtomicPrefix,
      kExprI32AtomicSub])
    .exportAs("atomic_sub");
  builder.addFunction("atomic_sub16", kSig_i_ii)
    .addBody([
      kExprGetLocal, 0,
      kExprGetLocal, 1,
      kAtomicPrefix,
      kExprI32AtomicSub16U])
    .exportAs("atomic_sub16");
  builder.addFunction("atomic_sub8", kSig_i_ii)
    .addBody([
      kExprGetLocal, 0,
      kExprGetLocal, 1,
      kAtomicPrefix,
      kExprI32AtomicSub8U])
    .exportAs("atomic_sub8");

  let module = new WebAssembly.Module(builder.toBuffer());
  let instance = (new WebAssembly.Instance(module,
        {m: {imported_mem: memory}}));

  // 32-bit Sub
  let i32 = new Uint32Array(memory.buffer);
  for (i = 0; i < i32.length; i++) {
    i32[i] = i32.length;
    assertEquals(i32.length, instance.exports.atomic_sub(i * 4, i));
    assertEquals(i32.length - i, i32[i]);
  }

  // 16-bit Sub
  let i16 = new Uint16Array(memory.buffer);
  for (i = 0; i < i16.length; i++) {
    i16[i] = 0xffff;
    assertEquals(0xffff, instance.exports.atomic_sub16(i * 2, 0x1234));
    assertEquals(0xffff - 0x1234, i16[i]);
  }

  // 8-bit Sub
  let i8 = new Uint8Array(memory.buffer);
  for (i = 0; i < i8.length; i++) {
    i8[i] = 0xff;
    assertEquals(0xff, instance.exports.atomic_sub8(i, i % 0xff));
    assertEquals(0xff - i % 0xff, i8[i]);
  }

  var subs = [{func: instance.exports.atomic_sub, memtype_size: 4},
  {func: instance.exports.atomic_sub16, memtype_size: 2},
  {func: instance.exports.atomic_sub8, memtype_size: 1}];

  VerifyBoundsCheck(memory.buffer, subs, 20);

})();

(function TestAtomicAnd() {
  print("TestAtomicAnd");
  let memory = new WebAssembly.Memory({initial: 5, maximum: 20, shared: true});
  let builder = new WasmModuleBuilder();
  builder.addImportedMemory("m", "imported_mem");
  builder.addFunction("atomic_and", kSig_i_ii)
    .addBody([
      kExprGetLocal, 0,
      kExprGetLocal, 1,
      kAtomicPrefix,
      kExprI32AtomicAnd])
    .exportAs("atomic_and");
  builder.addFunction("atomic_and16", kSig_i_ii)
    .addBody([
      kExprGetLocal, 0,
      kExprGetLocal, 1,
      kAtomicPrefix,
      kExprI32AtomicAnd16U])
    .exportAs("atomic_and16");
  builder.addFunction("atomic_and8", kSig_i_ii)
    .addBody([
      kExprGetLocal, 0,
      kExprGetLocal, 1,
      kAtomicPrefix,
      kExprI32AtomicAnd8U])
    .exportAs("atomic_and8");

  let module = new WebAssembly.Module(builder.toBuffer());
  let instance = (new WebAssembly.Instance(module,
        {m: {imported_mem: memory}}));

  // 32-bit And
  let i32 = new Uint32Array(memory.buffer);
  for (i = 0; i < i32.length; i++) {
    i32[i] = i32.length;
    assertEquals(i32.length, instance.exports.atomic_and(i * 4, i));
    assertEquals(i32.length & i, i32[i]);
  }

  // 16-bit And
  let i16 = new Uint16Array(memory.buffer);
  for (i = 0; i < i16.length; i++) {
    i16[i] = 0xffff;
    assertEquals(0xffff, instance.exports.atomic_and16(i * 2, 0x1234));
    assertEquals(0xffff & 0x1234, i16[i]);
  }

  // 8-bit And
  let i8 = new Uint8Array(memory.buffer);
  for (i = 0; i < i8.length; i++) {
    i8[i] = 0xff;
    assertEquals(0xff, instance.exports.atomic_and8(i, i % 0xff));
    assertEquals(0xff & i % 0xff, i8[i]);
  }

  var ands = [{func: instance.exports.atomic_and, memtype_size: 4},
  {func: instance.exports.atomic_and16, memtype_size: 2},
  {func: instance.exports.atomic_and8, memtype_size: 1}];

  VerifyBoundsCheck(memory.buffer, ands, 20);
})();

(function TestAtomicOr() {
  print("TestAtomicOr");
  let memory = new WebAssembly.Memory({initial: 5, maximum: 20, shared: true});
  let builder = new WasmModuleBuilder();
  builder.addImportedMemory("m", "imported_mem");
  builder.addFunction("atomic_or", kSig_i_ii)
    .addBody([
      kExprGetLocal, 0,
      kExprGetLocal, 1,
      kAtomicPrefix,
      kExprI32AtomicOr])
    .exportAs("atomic_or");
  builder.addFunction("atomic_or16", kSig_i_ii)
    .addBody([
      kExprGetLocal, 0,
      kExprGetLocal, 1,
      kAtomicPrefix,
      kExprI32AtomicOr16U])
    .exportAs("atomic_or16");
  builder.addFunction("atomic_or8", kSig_i_ii)
    .addBody([
      kExprGetLocal, 0,
      kExprGetLocal, 1,
      kAtomicPrefix,
      kExprI32AtomicOr8U])
    .exportAs("atomic_or8");

  let module = new WebAssembly.Module(builder.toBuffer());
  let instance = (new WebAssembly.Instance(module,
        {m: {imported_mem: memory}}));

  // 32-bit Or
  let i32 = new Uint32Array(memory.buffer);
  for (i = 0; i < i32.length; i++) {
    i32[i] = i32.length;
    assertEquals(i32.length, instance.exports.atomic_or(i * 4, i));
    assertEquals(i32.length | i, i32[i]);
  }

  // 16-bit Or
  let i16 = new Uint16Array(memory.buffer);
  for (i = 0; i < i16.length; i++) {
    i16[i] = 0xffff;
    assertEquals(0xffff, instance.exports.atomic_or16(i * 2, 0x1234));
    assertEquals(0xffff | 0x1234, i16[i]);
  }

  // 8-bit Or
  let i8 = new Uint8Array(memory.buffer);
  for (i = 0; i < i8.length; i++) {
    i8[i] = 0xff;
    assertEquals(0xff, instance.exports.atomic_or8(i, i % 0xff));
    assertEquals(0xff | i % 0xff, i8[i]);
  }

  var ors = [{func: instance.exports.atomic_or, memtype_size: 4},
  {func: instance.exports.atomic_or16, memtype_size: 2},
  {func: instance.exports.atomic_or8, memtype_size: 1}];

  VerifyBoundsCheck(memory.buffer, ors, 20);

})();

(function TestAtomicXor() {
  print("TestAtomicXor");
  let memory = new WebAssembly.Memory({initial: 5, maximum: 20, shared: true});
  let builder = new WasmModuleBuilder();
  builder.addImportedMemory("m", "imported_mem");
  builder.addFunction("atomic_xor", kSig_i_ii)
    .addBody([
      kExprGetLocal, 0,
      kExprGetLocal, 1,
      kAtomicPrefix,
      kExprI32AtomicXor])
    .exportAs("atomic_xor");
  builder.addFunction("atomic_xor16", kSig_i_ii)
    .addBody([
      kExprGetLocal, 0,
      kExprGetLocal, 1,
      kAtomicPrefix,
      kExprI32AtomicXor16U])
    .exportAs("atomic_xor16");
  builder.addFunction("atomic_xor8", kSig_i_ii)
    .addBody([
      kExprGetLocal, 0,
      kExprGetLocal, 1,
      kAtomicPrefix,
      kExprI32AtomicXor8U])
    .exportAs("atomic_xor8");

  let module = new WebAssembly.Module(builder.toBuffer());
  let instance = (new WebAssembly.Instance(module,
        {m: {imported_mem: memory}}));

  // 32-bit Xor
  let i32 = new Uint32Array(memory.buffer);
  for (i = 0; i < i32.length; i++) {
    i32[i] = i32.length;
    assertEquals(i32.length, instance.exports.atomic_xor(i * 4, i));
    assertEquals(i32.length ^ i, i32[i]);
  }

  // 16-bit Xor
  let i16 = new Uint16Array(memory.buffer);
  for (i = 0; i < i16.length; i++) {
    i16[i] = 0xffff;
    assertEquals(0xffff, instance.exports.atomic_xor16(i * 2, 0x5678));
    assertEquals(0xffff ^ 0x5678, i16[i]);
  }

  // 8-bit Xor
  let i8 = new Uint8Array(memory.buffer);
  for (i = 0; i < i8.length; i++) {
    i8[i] = 0xff;
    assertEquals(0xff, instance.exports.atomic_xor8(i, i % 0xff));
    assertEquals(0xff ^ i % 0xff, i8[i]);
  }

  var xors = [{func: instance.exports.atomic_xor, memtype_size: 4},
  {func: instance.exports.atomic_xor16, memtype_size: 2},
  {func: instance.exports.atomic_xor8, memtype_size: 1}];

  VerifyBoundsCheck(memory.buffer, xors, 20);

})();
