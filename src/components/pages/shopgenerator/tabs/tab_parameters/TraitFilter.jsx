import { useState } from "react";
import { useShopGenerator } from "../../../../../context/ShopGeneratorContext";
import Tag from "../../shared/Tag";
import Section from "../../shared/Section";
import traitList from "../../../../../../public/trait-list.json";
import ButtonGroup from "../../shared/ButtonGroup";
function TraitFilter() {
    const { getTraitState, toggleTrait, clearTraitSelections } = useShopGenerator();
    const [isCollapsed, setIsCollapsed] = useState(false);
    return (
        <Section title="Traits"
        buttonGroup={
                <ButtonGroup handleReset={clearTraitSelections} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
            }
        >
            <div className="filter-grid">
                {!isCollapsed && (
                    <div className="filter-grid-content">
                        {traitList.map(({ Trait }) => (
                            <Tag
                                name={Trait}
                                key={Trait}
                                state={getTraitState(Trait)}
                                onClick={() => toggleTrait(Trait)}
                            />
                        ))}
                    </div>
                )}
            </div>
            <button onClick={clearTraitSelections} className="clear-button">
                Clear Traits
            </button>
        </Section>
    );
}

export default TraitFilter;
