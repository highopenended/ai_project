import { useShopGenerator } from "../../../../../context/ShopGeneratorContext";
import FilterButton from "./filterbutton/FilterButton";
import Section from "../../../shared/Section";
import traitList from "../../../../../../public/trait-list.json";

function TraitFilter() {
    const { getTraitState, toggleTrait, clearTraitSelections } = useShopGenerator();

    return (
        <Section title="Traits">
            <div className="filter-grid">
                {traitList.map(({ Trait }) => (
                    <FilterButton
                        key={Trait}
                        label={Trait}
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
