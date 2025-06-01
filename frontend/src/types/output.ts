export interface Output {
  is_add_closed: boolean
  is_add_closed_contradiction: string
  is_add_associative: boolean
  is_add_associative_contradiction: string
  has_add_identity: boolean
  add_identity: string
  is_add_inverse: boolean
  is_add_inverse_contradiction: string
  is_add_commutative: boolean
  is_add_commutative_contradiction: string

  is_add_group: boolean

  is_mul_closed: boolean
  is_mul_closed_contradiction: string
  is_mul_associative: boolean
  is_mul_associative_contradiction: string
  is_distributive: boolean
  is_distributive_contradiction: string

  is_ring: boolean

  is_mul_commutative: boolean
  is_mul_commutative_contradiction: string
  has_mul_identity: boolean
  mul_identity: string
  has_mul_zero_divisors: boolean
  has_mul_zero_divisors_contradiction: string

  is_integral_domain: boolean

  is_mul_inverse: boolean
  is_mul_inverse_contradiction: string

  is_field: boolean
  is_divison_ring: Boolean

  insight: string

  add_heatmap: string
  mul_heatmap: string

  zero_divisor_graph: string

  unit_graph: string

  colormap: string
}