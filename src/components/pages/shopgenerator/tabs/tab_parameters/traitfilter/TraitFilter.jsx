import { useState } from "react";
import { useShopGenerator } from "../../../utils/shopGeneratorContext";
import Section from "../../../shared/Section";
import traitList from "../../../../../../../public/trait-list.json";
import ButtonGroup from "../../../shared/ButtonGroup";
import SearchBar from "../../../shared/SearchBar";
import TagContainer from "../../../shared/TagContainer";

function TraitFilter() {
    const { getTraitState, toggleTrait, clearTraitSelections } = useShopGenerator();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const filteredTraits = traitList
        .filter(({ Trait }) =>
            Trait.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => a.Trait.localeCompare(b.Trait))
        .map(({ Trait }) => ({
            name: Trait
        }));

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
            {!isCollapsed && (
                <TagContainer
                    tags={filteredTraits}
                    onTagClick={toggleTrait}
                    getTagState={getTraitState}
                />
            )}
        </Section>
    );
}

export default TraitFilter;
