import numpy as np
import matplotlib.pyplot as plt
import networkx as nx

def indexify_table(table, elements):
    elem_to_idx = {e: i for i, e in enumerate(elements)}
    return [[elem_to_idx[val] for val in row] for row in table]

def analyze_ring(add_table_raw, mul_table_raw, elements):
    n = len(elements)
    elem_to_idx = {e: i for i, e in enumerate(elements)}
    idx_to_elem = {i: e for i, e in enumerate(elements)}

    add_table = indexify_table(add_table_raw, elements)
    mul_table = indexify_table(mul_table_raw, elements)

    def is_closed(table):
        return all(0 <= table[i][j] < n for i in range(n) for j in range(n))

    def is_associative(table):
        for a in range(n):
            for b in range(n):
                for c in range(n):
                    if table[table[a][b]][c] != table[a][table[b][c]]:
                        return False
        return True

    def find_identity(table):
        for e in range(n):
            if all(table[e][i] == i and table[i][e] == i for i in range(n)):
                return e
        return None

    def has_inverses(table, identity):
        for a in range(n):
            if not any(table[a][b] == identity and table[b][a] == identity for b in range(n)):
                return False
        return True

    def is_commutative(table):
        for i in range(n):
            for j in range(n):
                if table[i][j] != table[j][i]:
                    return False, (i, j)
        return True, None

    def is_distributive(add_table, mul_table):
        for a in range(n):
            for b in range(n):
                for c in range(n):
                    if mul_table[a][add_table[b][c]] != add_table[mul_table[a][b]][mul_table[a][c]]:
                        return False
                    if mul_table[add_table[b][c]][a] != add_table[mul_table[b][a]][mul_table[c][a]]:
                        return False
        return True

    def is_additive_group():
        if not is_closed(add_table):
            return False
        if not is_associative(add_table):
            return False
        identity = find_identity(add_table)
        if identity is None:
            return False
        if not has_inverses(add_table, identity):
            return False
        comm, _ = is_commutative(add_table)
        return comm

    def find_multiplicative_identity():
        for e in range(n):
            if all(mul_table[e][i] == i and mul_table[i][e] == i for i in range(n)):
                return e
        return None

    def has_zero_divisors():
        zero = find_identity(add_table)
        for a in range(n):
            for b in range(n):
                if a != zero and b != zero and mul_table[a][b] == zero:
                    return True, (a, b)
        return False, None

    def all_nonzero_elements_have_inverse(identity):
        for a in range(n):
            if a == identity:
                continue
            if not any(mul_table[a][b] == identity for b in range(n)):
                return False, a
        return True, None

    print("🔍 Analyzing ring properties...\n")

    if not is_additive_group() or not is_closed(mul_table) or not is_associative(mul_table) or not is_distributive(add_table, mul_table):
        print("❌ The given tables do not form a valid ring.")
        return

    print("✅ Valid ring detected.")

    is_comm, example = is_commutative(mul_table)
    if is_comm:
        print("✔️ The ring is **commutative** under multiplication.")
    else:
        i, j = example
        print(f"❌ The ring is **not commutative**: {idx_to_elem[i]} * {idx_to_elem[j]} = {idx_to_elem[mul_table[i][j]]}, but {idx_to_elem[j]} * {idx_to_elem[i]} = {idx_to_elem[mul_table[j][i]]}.")

    mul_identity = find_multiplicative_identity()
    if mul_identity is not None:
        print(f"✔️ The ring has a **multiplicative identity**: element {idx_to_elem[mul_identity]}.")
    else:
        print("❌ The ring has **no multiplicative identity**.")

    has_zero_div, example = has_zero_divisors()
    if not has_zero_div and is_comm and mul_identity is not None:
        print("✔️ The ring is an **integral domain**.")
    else:
        print("❌ The ring is **not an integral domain**.")
        if mul_identity is None:
            print("   ⤷ Reason: No multiplicative identity.")
        if not is_comm:
            print("   ⤷ Reason: Multiplication is not commutative.")
        if has_zero_div:
            a, b = example
            print(f"   ⤷ Reason: {idx_to_elem[a]} * {idx_to_elem[b]} = 0 → zero divisor.")

    if mul_identity is not None:
        all_inv, offender = all_nonzero_elements_have_inverse(mul_identity)
        if all_inv:
            if is_comm:
                print("✔️ The ring is a **field**.")
            else:
                print("✔️ The ring is a **division ring**.")
        else:
            print("❌ The ring is **not a division ring**.")
            print(f"   ⤷ Reason: Element {idx_to_elem[offender]} has no multiplicative inverse.")
    else:
        print("❌ Cannot be a division ring: no multiplicative identity.")

    print("\n📘 Insight:")
    if is_comm and not has_zero_div and mul_identity is not None:
        print("- This is a commutative ring with unity and no zero divisors: it's an integral domain.")
    elif is_comm and mul_identity is not None and all_inv:
        print("- All nonzero elements are invertible, and it's commutative: this is a finite field.")
    elif is_comm:
        print("- The ring is commutative but lacks other field properties.")
    else:
        print("- The ring has noncommutative multiplication; likely a more general ring or algebraic structure.")

# ----------------------------------------

def plot_heatmaps(add_table_raw, mul_table_raw, elements):
    add = indexify_table(add_table_raw, elements)
    mul = indexify_table(mul_table_raw, elements)
    fig, axs = plt.subplots(1, 2, figsize=(10, 4))

    axs[0].imshow(add, cmap='Blues', interpolation='none')
    axs[0].set_title("Addition Table")
    axs[0].set_xticks(range(len(elements)))
    axs[0].set_yticks(range(len(elements)))
    axs[0].set_xticklabels(elements)
    axs[0].set_yticklabels(elements)

    axs[1].imshow(mul, cmap='Reds', interpolation='none')
    axs[1].set_title("Multiplication Table")
    axs[1].set_xticks(range(len(elements)))
    axs[1].set_yticks(range(len(elements)))
    axs[1].set_xticklabels(elements)
    axs[1].set_yticklabels(elements)

    plt.tight_layout()
    plt.show()

def plot_zero_divisor_graph(add_table_raw, mul_table_raw, elements):
    mul = indexify_table(mul_table_raw, elements)
    add = indexify_table(add_table_raw, elements)
    
    n = len(elements)
    zero = None
    for e in range(n):
        if all(add[e][i] == i and add[i][e] == i for i in range(n)):
            zero = e
            break
    if zero is None:
        print("No additive identity found; cannot plot zero-divisor graph.")
        return

    G = nx.Graph()
    G.add_nodes_from(elements[:zero] + elements[zero+1:])

    for i in range(n):
        if i == zero:
            continue
        for j in range(i+1, n):
            if j == zero:
                continue
            if mul[i][j] == zero:
                G.add_edge(elements[i], elements[j])

    pos = nx.spring_layout(G)
    nx.draw(G, pos, with_labels=True, node_color='skyblue', node_size=500, font_size=14)
    plt.title("Zero-Divisor Graph")
    plt.show()

def plot_unit_graph(add_table_raw, mul_table_raw, elements):
    mul = indexify_table(mul_table_raw, elements)
    add = indexify_table(add_table_raw, elements)

    n = len(elements)
    one = None
    for e in range(n):
        if all(mul[e][i] == i and mul[i][e] == i for i in range(n)):
            one = e
            break
    if one is None:
        print("No multiplicative identity found; cannot plot unit graph.")
        return

    units = []
    for i in range(n):
        if i == one:
            continue
        if any(mul[i][j] == one for j in range(n)):
            units.append(elements[i])

    G = nx.Graph()
    G.add_nodes_from(units)

    for i in range(len(units)):
        for j in range(i+1, len(units)):
            a = elements.index(units[i])
            b = elements.index(units[j])
            if mul[a][b] == one or mul[b][a] == one:
                G.add_edge(units[i], units[j])

    pos = nx.spring_layout(G)
    nx.draw(G, pos, with_labels=True, node_color='lightgreen', node_size=500, font_size=14)
    plt.title("Unit Graph")
    plt.show()

def plot_colormap(mul_table_raw, elements):
    mul = indexify_table(mul_table_raw, elements)
    fig, ax = plt.subplots(figsize=(6, 5))
    cax = ax.matshow(mul, cmap="coolwarm")
    plt.colorbar(cax)
    for (i, j), val in np.ndenumerate(mul):
        ax.text(j, i, elements[val], ha='center', va='center', color='black')
    ax.set_title("Multiplication Table Color Map")
    ax.set_xticks(range(len(elements)))
    ax.set_yticks(range(len(elements)))
    ax.set_xticklabels(elements)
    ax.set_yticklabels(elements)
    plt.xlabel("× j")
    plt.ylabel("i ×")
    plt.show()

# ----------------------------------------

n = 13
elements = [i for i in range(n)]
add = [[(i + j) % n for j in range(n)] for i in range(n)]
mul = [[(i * j) % n for j in range(n)] for i in range(n)]

# elements = ["(0,0)", "(0,1)", "(1,0)", "(1,1)"]
# add = [
#     ["(0,0)", "(0,1)", "(1,0)", "(1,1)"],
#     ["(0,1)", "(0,0)", "(1,1)", "(1,0)"],
#     ["(1,0)", "(1,1)", "(0,0)", "(0,1)"],
#     ["(1,1)", "(1,0)", "(0,1)", "(0,0)"],
# ]
# mul = [
#     ["(0,0)", "(0,0)", "(0,0)", "(0,0)"],
#     ["(0,0)", "(0,1)", "(0,0)", "(0,1)"],
#     ["(0,0)", "(0,0)", "(1,0)", "(1,0)"],
#     ["(0,0)", "(0,1)", "(1,0)", "(1,1)"],
# ]

analyze_ring(add, mul, elements)
plot_heatmaps(add, mul, elements)
plot_zero_divisor_graph(add, mul, elements)
plot_unit_graph(add, mul, elements)
plot_colormap(mul, elements)
