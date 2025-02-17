import { useState } from "react";
import { useShopGenerator } from "../../../utils/shopGeneratorContext";
import Section from "../../../shared/section/Section";
import traitList from "../../../../../../../public/trait-list.json";
import MiniButtonGroup from "../../../shared/minibuttongroup/MiniButtonGroup";
import SearchBar from "../../../shared/searchbar/SearchBar";
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
            miniButtonGroup={
                <MiniButtonGroup handleReset={clearTraitSelections} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
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
