import { useState } from "react";
import { useShopGenerator } from "../../../../../../context/ShopGeneratorContext";
import Tag from "../../../shared/Tag";
import Section from "../../../shared/Section";
import traitList from "../../../../../../../public/trait-list.json";
import ButtonGroup from "../../../shared/ButtonGroup";
import SearchBar from "../../../shared/SearchBar";

function TraitFilter() {
    const { getTraitState, toggleTrait, clearTraitSelections } = useShopGenerator();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const filteredTraits = traitList.filter(({ Trait }) =>
        Trait.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Section title="Traits"
            buttonGroup={
                <ButtonGroup handleReset={clearTraitSelections} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
            }
        >
            {!isCollapsed && (
                <SearchBar
                    placeholder="Search traits..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
            )}
            <div className="filter-grid">
                {!isCollapsed && (
                    <div className="filter-grid-content">
                        {filteredTraits.map(({ Trait }, index) => (
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
