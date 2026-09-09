;; The guide's two Rust functions (docs/platforms/javascript/guides/wasm/index.mdx:127-133 and
;; 202-212) hand-written in the WebAssembly text format, so the run needs no Rust toolchain.
;; `divide` traps with "divide by zero" when b is 0 (i32.div_s);
;; `compute_intensive_function` sums 0..iterations*1000 (wrapping, like Rust in release mode).
(module
  (func $divide (export "divide") (param $a i32) (param $b i32) (result i32)
    local.get $a
    local.get $b
    i32.div_s)

  (func $compute_intensive_function (export "compute_intensive_function") (param $iterations i32) (result i32)
    (local $sum i32)
    (local $i i32)
    (local $n i32)
    local.get $iterations
    i32.const 1000
    i32.mul
    local.set $n
    block $done
      loop $loop
        local.get $i
        local.get $n
        i32.ge_s
        br_if $done
        local.get $sum
        local.get $i
        i32.add
        local.set $sum
        local.get $i
        i32.const 1
        i32.add
        local.set $i
        br $loop
      end
    end
    local.get $sum)
)
