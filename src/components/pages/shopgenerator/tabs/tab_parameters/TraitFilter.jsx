import { useShopGenerator } from "../../../../../context/ShopGeneratorContext";
import Tag from "../../shared/Tag";
import Section from "../../shared/Section";
import traitList from "../../../../../../public/trait-list.json";

function TraitFilter() {
    const { getTraitState, toggleTrait, clearTraitSelections } = useShopGenerator();

    return (
        <Section title="Traits">
            <div className="filter-grid">
                {traitList.map(({ Trait }) => (
                    <Tag
                        name={Trait}
                        key={Trait}
                        state={getTraitState(Trait)}
                        onClick={() => toggleTrait(Trait)}
                    />
                ))}
            </div>
            <button onClick={clearTraitSelections} className="clear-button">
                Clear Traits
            </button>
        </Section>
    );
}

export default TraitFilter;
