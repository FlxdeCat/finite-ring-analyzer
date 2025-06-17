from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import numpy as np
import matplotlib.pyplot as plt
import networkx as nx
import base64
from io import BytesIO

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RingInput(BaseModel):
    elements: List[str]
    add: List[List[str]]
    mul: List[List[str]]

@app.post("/analyze")
def analyze_ring(data: RingInput):
    elements = data.elements
    add_element = data.add
    mul_element = data.mul

    n = len(elements)
    element_to_index = {e: i for i, e in enumerate(elements)}
    index_to_element = {i: e for i, e in enumerate(elements)}

    def table_index(table):
        return [[element_to_index[val] for val in row] for row in table]

    add_index = table_index(add_element)
    mul_index = table_index(mul_element)

    def is_closed(table, op):
        for i in range(n):
            for j in range(n):
                if not (0 <= table[i][j] < n):
                    return False, f"{index_to_element[i]} {op} {index_to_element[j]} = invalid"
        return True, ""

    def is_associative(table, op):
        for a in range(n):
            for b in range(n):
                for c in range(n):
                    if table[table[a][b]][c] != table[a][table[b][c]]:
                        return False, f"({index_to_element[a]} {op} {index_to_element[b]}) {op} {index_to_element[c]} != {index_to_element[a]} {op} ({index_to_element[b]} {op} {index_to_element[c]})"
        return True, ""

    def get_add_identity():
        for e in range(n):
            if all(add_index[e][i] == i and add_index[i][e] == i for i in range(n)):
                return e
        return None

    def is_inverse(table, identity):
        for a in range(n):
            if not any(table[a][b] == identity and table[b][a] == identity for b in range(n)):
                return False, f"{index_to_element[a]} has no inverse"
        return True, ""

    def is_commutative(table, op):
        for i in range(n):
            for j in range(n):
                if table[i][j] != table[j][i]:
                    return False, f"{index_to_element[i]} {op} {index_to_element[j]} != {index_to_element[j]} {op} {index_to_element[i]}"
        return True, ""

    def is_distributive():
        for a in range(n):
            for b in range(n):
                for c in range(n):
                    if mul_index[a][add_index[b][c]] != add_index[mul_index[a][b]][mul_index[a][c]]:
                        return False, f"{index_to_element[a]} * ({index_to_element[b]} + {index_to_element[c]}) != {index_to_element[a]} * {index_to_element[b]} + {index_to_element[a]} * {index_to_element[c]}"
                    if mul_index[add_index[b][c]][a] != add_index[mul_index[b][a]][mul_index[c][a]]:
                        return False, f"({index_to_element[b]} + {index_to_element[c]}) * {index_to_element[a]} != {index_to_element[b]} * {index_to_element[a]} + {index_to_element[c]} * {index_to_element[a]}"
        return True, ""

    def get_mul_identity():
        zero = get_add_identity()
        if zero is None:
            return False, ""
        for e in range(n):
            if e == zero:
                continue
            if all(mul_index[e][i] == i and mul_index[i][e] == i for i in range(n)):
                return e
        return None

    def get_zero_divisors():
        zero = get_add_identity()
        if zero is None:
            return False, ""
        for a in range(n):
            if a == zero:
                continue
            for b in range(n):
                if b == zero:
                    continue
                if mul_index[a][b] == zero:
                    return True, f"{index_to_element[a]} * {index_to_element[b]} = 0"
        return False, ""

    def is_mul_inverse(identity, zero):
        found_nonzero = False
        for a in range(n):
            if a == identity or a == zero:
                continue
            found_nonzero = True
            if not any(mul_index[a][b] == identity and mul_index[b][a] == identity for b in range(n)):
                return False, f"{index_to_element[a]} has no multiplicative inverse"
        if not found_nonzero:
            return False, "No nonzero elements to verify multiplicative inverses"
        return True, ""

    is_add_closed, is_add_closed_contradiction = is_closed(add_index, "+")
    is_add_associative, is_add_associative_contradiction = is_associative(add_index, "+")
    add_identity = get_add_identity()
    has_add_identity = add_identity is not None
    is_add_inverse, is_add_inverse_contradiction = is_inverse(add_index, add_identity) if has_add_identity else (False, "No identity")
    is_add_commutative, is_add_commutative_contradiction = is_commutative(add_index, "+")
    is_add_group = all([is_add_closed, is_add_associative, has_add_identity, is_add_inverse, is_add_commutative])

    is_mul_closed, is_mul_closed_contradiction = is_closed(mul_index, "*")
    is_mul_associative, is_mul_associative_contradiction = is_associative(mul_index, "*")
    is_distributive, is_distributive_contradiction = is_distributive()
    is_ring = is_add_group and is_mul_closed and is_mul_associative and is_distributive

    is_mul_commutative, is_mul_commutative_contradiction = is_commutative(mul_index, "*")
    is_commutative_ring = is_ring and is_mul_commutative

    mul_identity = get_mul_identity()
    has_mul_identity = mul_identity is not None
    has_mul_zero_divisors, has_mul_zero_divisors_contradiction = get_zero_divisors()
    is_integral_domain = has_mul_identity and is_mul_commutative and not has_mul_zero_divisors
    is_mul_inverse, is_mul_inverse_contradiction = is_mul_inverse(mul_identity, add_identity) if has_mul_identity and has_add_identity else (False, "No identity")
    is_field = is_integral_domain and is_mul_inverse
    is_divison_ring = has_mul_identity and is_mul_inverse and is_mul_commutative

    is_commutative_ring_contradiction = is_ring_contradiction = is_field_contradiction = is_integral_domain_contradiction = is_divison_ring_contradiction = ""

    insight_reasons = []

    if not is_add_group:
        if not is_add_closed:
            insight_reasons.append("addition is not closed")
        if not is_add_associative:
            insight_reasons.append("addition is not associative")
        if not has_add_identity:
            insight_reasons.append("addition has no identity")
        if not is_add_inverse:
            insight_reasons.append("not all elements have additive inverses")
        if not is_add_commutative:
            insight_reasons.append("addition is not commutative")

    if not is_mul_closed:
        insight_reasons.append("multiplication is not closed")
    if not is_mul_associative:
        insight_reasons.append("multiplication is not associative")
    if not is_distributive:
        insight_reasons.append("multiplication is not distributive over addition")

    if not is_ring:
        if len(insight_reasons) > 2:
            formatted = ", ".join(insight_reasons[:-1]) + ", and " + insight_reasons[-1]
        elif len(insight_reasons) == 2:
            formatted = " and ".join(insight_reasons)
        elif insight_reasons:
            formatted =  insight_reasons[0]
        insight = "This is not a ring because " + formatted + "."
    else:
        if is_field:
            insight = "This is a finite field."
        elif is_integral_domain:
            insight = "This is an integral domain, but not a field because "
            if not is_mul_inverse:
                insight += "not all nonzero elements have multiplicative inverses."
            elif not has_mul_identity:
                insight += "there is no multiplicative identity."
            elif not is_mul_commutative:
                insight += "multiplication is not commutative."
            else:
                insight += "some other multiplicative property fails."
        elif is_divison_ring:
            insight = "This is a division ring, but not a field because multiplication is not commutative."
        else:
            reasons = []
            if not is_mul_inverse:
                reasons.append("not all nonzero elements have multiplicative inverses")
            if not has_mul_identity:
                reasons.append("there is no multiplicative identity")
            if not is_mul_commutative:
                reasons.append("multiplication is not commutative")
            if has_mul_zero_divisors:
                reasons.append("there are zero divisors")
            if not is_distributive:
                reasons.append("multiplication is not distributive over addition")

            if len(reasons) > 2:
                formatted_reasons = ", ".join(reasons[:-1]) + ", and " + reasons[-1]
            elif len(reasons) == 2:
                formatted_reasons = " and ".join(reasons)
            elif reasons:
                formatted_reasons =  reasons[0]
            insight = "This is a ring, but it is not a field, integral domain, or division ring because " + formatted_reasons + "."

    def fig_to_base64(fig):
        buf = BytesIO()
        fig.savefig(buf, format="png", bbox_inches="tight")
        plt.close(fig)
        buf.seek(0)
        return base64.b64encode(buf.read()).decode('utf-8')

    def heatmap(table, title, cmap):
        fig, ax = plt.subplots()
        matrix = table_index(table)
        ax.imshow(matrix, cmap=cmap)
        ax.set_title(title)
        ax.set_xticks(range(n))
        ax.set_xticklabels(elements)
        ax.set_yticks(range(n))
        ax.set_yticklabels(elements)
        return fig_to_base64(fig)

    def zero_divisor_graph():
        G = nx.Graph()
        zero = add_identity
        if zero is None:
            return ""
        G.add_nodes_from(elements[:zero] + elements[zero+1:])
        for i in range(n):
            if i == zero: continue
            for j in range(i+1, n):
                if j == zero: continue
                if mul_index[i][j] == zero:
                    G.add_edge(elements[i], elements[j])
        fig = plt.figure()
        nx.draw(G, with_labels=True, node_color='skyblue')
        return fig_to_base64(fig)

    def unit_graph():
        if not has_mul_identity:
            return ""
        G = nx.Graph()
        units = [i for i in range(n) if i != mul_identity and i != add_identity and any(mul_index[i][j] == mul_identity and mul_index[j][i] == mul_identity for j in range(n))]
        G.add_nodes_from([elements[i] for i in units])
        for i in range(len(units)):
            for j in range(i+1, len(units)):
                if mul_index[units[i]][units[j]] == mul_identity or mul_index[units[j]][units[i]] == mul_identity:
                    G.add_edge(elements[units[i]], elements[units[j]])
        fig = plt.figure()
        nx.draw(G, with_labels=True, node_color='lightgreen')
        return fig_to_base64(fig)

    def colormap():
        fig, ax = plt.subplots()
        matrix = table_index(mul_element)
        cax = ax.matshow(matrix, cmap="coolwarm")
        ax.set_xticks(range(n))
        ax.set_xticklabels(elements)
        ax.set_yticks(range(n))
        ax.set_yticklabels(elements)
        return fig_to_base64(fig)
    
    if has_add_identity and has_mul_identity and add_identity == mul_identity:
        is_ring = is_commutative_ring = is_field = is_integral_domain = is_divison_ring = False
        insight = "This cannot be a ring or field because the additive and multiplicative identities are the same."
        is_commutative_ring_contradiction = is_ring_contradiction = is_field_contradiction = is_integral_domain_contradiction = is_divison_ring_contradiction = "1 == 0"

    if n <= 1:
        is_ring = is_commutative_ring = is_field = is_integral_domain = is_divison_ring = False
        insight = "This set cannot form a ring or field because it contains only one element."
        is_commutative_ring_contradiction = is_ring_contradiction = is_field_contradiction = is_integral_domain_contradiction = is_divison_ring_contradiction = "Contains only one element"

    return {
        "is_add_closed": is_add_closed,
        "is_add_closed_contradiction": is_add_closed_contradiction,
        "is_add_associative": is_add_associative,
        "is_add_associative_contradiction": is_add_associative_contradiction,
        "has_add_identity": has_add_identity,
        "add_identity": index_to_element[add_identity] if has_add_identity else "",
        "is_add_inverse": is_add_inverse,
        "is_add_inverse_contradiction": is_add_inverse_contradiction,
        "is_add_commutative": is_add_commutative,
        "is_add_commutative_contradiction": is_add_commutative_contradiction,
        "is_add_group": is_add_group,
        "is_mul_closed": is_mul_closed,
        "is_mul_closed_contradiction": is_mul_closed_contradiction,
        "is_mul_associative": is_mul_associative,
        "is_mul_associative_contradiction": is_mul_associative_contradiction,
        "is_distributive": is_distributive,
        "is_distributive_contradiction": is_distributive_contradiction,
        "is_ring": is_ring,
        "is_ring_contradiction": is_ring_contradiction,
        "is_mul_commutative": is_mul_commutative,
        "is_mul_commutative_contradiction": is_mul_commutative_contradiction,
        "is_commutative_ring": is_commutative_ring,
        "is_commutative_ring_contradiction": is_commutative_ring_contradiction,
        "has_mul_identity": has_mul_identity,
        "mul_identity": index_to_element[mul_identity] if has_mul_identity else "",
        "has_mul_zero_divisors": has_mul_zero_divisors,
        "has_mul_zero_divisors_contradiction": has_mul_zero_divisors_contradiction,
        "is_integral_domain": is_integral_domain,
        "is_integral_domain_contradiction": is_integral_domain_contradiction,
        "is_mul_inverse": is_mul_inverse,
        "is_mul_inverse_contradiction": is_mul_inverse_contradiction,
        "is_field": is_field,
        "is_field_contradiction": is_field_contradiction,
        "is_divison_ring": is_divison_ring,
        "is_divison_ring_contradiction": is_divison_ring_contradiction,
        "insight": insight,
        "add_heatmap": heatmap(add_element, "Addition Table", "Blues"),
        "mul_heatmap": heatmap(mul_element, "Multiplication Table", "Reds"),
        "zero_divisor_graph": zero_divisor_graph(),
        "unit_graph": unit_graph(),
        "colormap": colormap()
    }

# n = 13
# elements = [i for i in range(n)]
# add = [[(i + j) % n for j in range(n)] for i in range(n)]
# mul = [[(i * j) % n for j in range(n)] for i in range(n)]

# uvicorn api:app --reload