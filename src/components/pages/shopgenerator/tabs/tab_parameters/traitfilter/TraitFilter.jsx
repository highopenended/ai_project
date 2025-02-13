import { useState } from "react";
import { useShopGenerator } from "../../../../../../context/ShopGeneratorContext";
import Tag from "../../../shared/Tag";
import Section from "../../../shared/Section";
import traitList from "../../../../../../../public/trait-list.json";
import ButtonGroup from "../../../shared/ButtonGroup";
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
                        {traitList.map(({ Trait }, index) => (
                            <Tag
                                name={Trait}
                                key={Trait + index}
                                state={getTraitState(Trait)}
                                onClick={() => toggleTrait(Trait)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </Section>
    );
}

export default TraitFilter;
