import json
import os

input_file = r"c:\Users\MY PC\Documents\GitHub\hivocab\data\sat_chunks\chunk_20.json"
output_file = r"c:\Users\MY PC\Documents\GitHub\hivocab\data\sat_chunks\chunk_20_enriched.json"

with open(input_file, "r", encoding="utf-8") as f:
    chunk_data = json.load(f)

# Enrichment data mapping by global_order
enrichments = {
    951: {
        "phonetic": "/ˈdɒktrɪn/",
        "pos": "n.",
        "vi_meaning": "Học thuyết, giáo lý",
        "example_sentence": "The Monroe Doctrine asserted that any further European colonization in the Western Hemisphere would be viewed as an act of hostility toward the United States."
    },
    952: {
        "phonetic": "/ˈdɒkjument/",
        "pos": "v.",
        "vi_meaning": "Ghi chép tài liệu, thu thập bằng chứng",
        "example_sentence": "Anthropologists spent decades in the Amazon basin to meticulously document the endangered oral traditions and botanical remedies of indigenous healers."
    },
    953: {
        "phonetic": "/dɒf/",
        "pos": "v.",
        "vi_meaning": "Cởi bỏ mũ, ngả mũ chào",
        "example_sentence": "As the funeral cortege passed through the village square, the solemn townsfolk stepped forward to doff their hats in quiet reverence."
    },
    954: {
        "phonetic": "/ˈdɒɡɪd/",
        "pos": "adj.",
        "vi_meaning": "Kiên cường, bền bỉ, gan góc",
        "example_sentence": "Through years of archival dead ends and bureaucratic obstruction, the investigative journalist pursued the corruption scandal with dogged determination."
    },
    955: {
        "phonetic": "/ˈdɒɡərəl/",
        "pos": "n.",
        "vi_meaning": "Thơ vần vè vụng về, thơ dở",
        "example_sentence": "Dismissing the political pamphlet as mere doggerel, the literary critic argued that its clumsy couplets and irregular meter lacked artistic merit."
    },
    956: {
        "phonetic": "/dɒɡˈmætɪk/",
        "pos": "adj.",
        "vi_meaning": "Giáo điều, độc đoán",
        "example_sentence": "Rather than encouraging open empirical debate, the committee chairman adopted a dogmatic stance, summarily rejecting any hypothesis that challenged conventional wisdom."
    },
    957: {
        "phonetic": "/ˈdɒldrəmz/",
        "pos": "n.",
        "vi_meaning": "Tình trạng đình trệ, cảnh ảm đạm",
        "example_sentence": "Targeted public investments in renewable infrastructure finally helped lift the regional manufacturing sector out of its prolonged economic doldrums."
    },
    958: {
        "phonetic": "/ˈdəʊlfl/",
        "pos": "adj.",
        "vi_meaning": "U sầu, buồn thảm, ai oán",
        "example_sentence": "The solitary cellist played a doleful elegy whose melancholic cadences echoed mournfully through the cavernous sanctuary."
    },
    959: {
        "phonetic": "/dəʊlt/",
        "pos": "n.",
        "vi_meaning": "Kẻ khờ dại, người ngu ngốc",
        "example_sentence": "Though political rivals unfairly dismissed him as a bumbling dolt, the premier quietly outmaneuvered his opponents through shrewd parliamentary tactics."
    },
    960: {
        "phonetic": "/ˈdɒmɪsaɪl/",
        "pos": "n.",
        "vi_meaning": "Nơi cư trú, nơi thường trú",
        "example_sentence": "To claim statutory tax exemption, the expatriate was required to furnish legal records establishing that her permanent domicile remained overseas."
    },
    961: {
        "phonetic": "/ˌdɒmɪˈnɪər/",
        "pos": "v.",
        "vi_meaning": "Áp chế, hống hách, lấn át",
        "example_sentence": "The imperious party leader sought to domineer over junior legislators, demanding absolute allegiance on every contentious policy vote."
    },
    962: {
        "phonetic": "/dɒn/",
        "pos": "v.",
        "vi_meaning": "Mặc vào, khoác lên",
        "example_sentence": "Before venturing onto the lunar surface, astronauts were required to don pressurized suits engineered to withstand extreme thermal fluctuations."
    },
    963: {
        "phonetic": "/ˈduːdl/",
        "pos": "v.",
        "vi_meaning": "Vẽ nguệch ngoạc, vẽ lơ đãng",
        "example_sentence": "Distracted by the monotonous rhythm of the maritime inquiry, the witness began to doodle intricate nautical charts on the margins of his transcript."
    },
    964: {
        "phonetic": "/ˈdɔːmənt/",
        "pos": "adj.",
        "vi_meaning": "Ngủ yên, tạm thời bất hoạt",
        "example_sentence": "Seismologists warned that although the stratovolcano had lain dormant for three centuries, magma accumulation indicated a catastrophic eruption was brewing."
    },
    965: {
        "phonetic": "/ˈdɔːmə/",
        "pos": "n.",
        "vi_meaning": "Cửa sổ mái sổ ra",
        "example_sentence": "Sunlight filtered through the high dormer of the colonial garret, casting sharp geometric shadows across the weathered pine floorboards."
    },
    966: {
        "phonetic": "/ˈdɒsieɪ/",
        "pos": "n.",
        "vi_meaning": "Hồ sơ tài liệu chi tiết",
        "example_sentence": "Naval counterintelligence compiled an exhaustive dossier chronicling the covert communication channels exploited by foreign espionage rings."
    },
    967: {
        "phonetic": "/dəʊt/",
        "pos": "v.",
        "vi_meaning": "Cưng chiều hết mực, yêu quý mù quáng",
        "example_sentence": "Despite the young aristocrat's scandalous reputation, his wealthy aunt continued to dote upon him, funding his lavish excursions abroad."
    },
    968: {
        "phonetic": "/daʊs/",
        "pos": "v.",
        "vi_meaning": "Dội nước làm ướt sũng, dập tắt lửa",
        "example_sentence": "Before evacuating the alpine outpost, rangers had to thoroughly douse the campfire with buckets of snow to prevent a brushfire."
    },
    969: {
        "phonetic": "/ˈdaʊdi/",
        "pos": "adj.",
        "vi_meaning": "Luộm thuộm, lỗi mốt, quê mùa",
        "example_sentence": "Surrounded by aristocrats in embroidered silk robes, the foreign envoy appeared conspicuously dowdy in his plain woolen broadcloth suit."
    },
    970: {
        "phonetic": "/ˈdaʊnkɑːst/",
        "pos": "adj.",
        "vi_meaning": "Chán nản, thất vọng, ủ rũ",
        "example_sentence": "When news arrived that the peace negotiations had abruptly collapsed, the weary delegates returned to their quarters in downcast spirits."
    },
    971: {
        "phonetic": "/dræb/",
        "pos": "adj.",
        "vi_meaning": "Xám xịt, nhạt nhẽo, buồn tẻ",
        "example_sentence": "The post-industrial docklands were dominated by drab concrete warehouses and rusting cranes that stood bleak against the winter sky."
    },
    972: {
        "phonetic": "/drəˈkəʊniən/",
        "pos": "adj.",
        "vi_meaning": "Hà khắc, cực kỳ nghiêm ngặt",
        "example_sentence": "Civil rights organizations petitioned the international court against the state's draconian surveillance statutes, alleging severe violations of privacy."
    },
    973: {
        "phonetic": "/dreɡz/",
        "pos": "n.",
        "vi_meaning": "Cặn bã, phần thừa thãi vô giá trị",
        "example_sentence": "By the winter of 1777, the besieged garrison had consumed their reserves and were reduced to drinking the foul dregs of stagnant cisterns."
    },
    974: {
        "phonetic": "/ˈdrɪvl/",
        "pos": "n.",
        "vi_meaning": "Chuyện nhảm nhí, lời nói vô nghĩa",
        "example_sentence": "The eminent philosopher refused to dignify the sensationalist pamphlet with a rebuttal, dismissing its conspiracy theories as unlettered drivel."
    },
    975: {
        "phonetic": "/drəʊl/",
        "pos": "adj.",
        "vi_meaning": "Khôi hài, hóm hỉnh kỳ quặc",
        "example_sentence": "With dry wit and deadpan delivery, the satirical columnist offered a droll commentary on the absurdities of metropolitan high society."
    },
    976: {
        "phonetic": "/drəʊn/",
        "pos": "v.",
        "vi_meaning": "Nói giọng đều đều buồn ngủ, kêu vo ve",
        "example_sentence": "As the parliamentary clerk continued to drone through the dozens of technical amendments, several legislators quietly dozed in their benches."
    },
    977: {
        "phonetic": "/drɒs/",
        "pos": "n.",
        "vi_meaning": "Xỉ kim loại, cặn bã vô giá trị",
        "example_sentence": "The metallurgist carefully skimmed the oxidized dross from the molten silver before pouring the purified metal into casting molds."
    },
    978: {
        "phonetic": "/ˈdrʌdʒəri/",
        "pos": "n.",
        "vi_meaning": "Công việc cực nhọc, sự vất vả nhàm chán",
        "example_sentence": "Prior to the mechanization of agriculture, weeding sprawling cotton fields by hand represented an unremitting drudgery for farm laborers."
    },
    979: {
        "phonetic": "/ˈdjuːbiəs/",
        "pos": "adj.",
        "vi_meaning": "Đáng nghi, mơ hồ, hoài nghi",
        "example_sentence": "Independent economic analysts remained deeply dubious of the central bank's inflation forecast, citing volatile global commodity prices."
    },
    980: {
        "phonetic": "/ˈdʌktaɪl/",
        "pos": "adj.",
        "vi_meaning": "Dễ uốn, dễ dát mỏng, dễ uốn nắn",
        "example_sentence": "Because gold is exceptionally ductile, a single ounce can be drawn into an ultrafine wire extending over fifty miles without fracturing."
    },
    981: {
        "phonetic": "/ˈdʌlsɪt/",
        "pos": "adj.",
        "vi_meaning": "Êm dịu, ngọt ngào, thánh thót",
        "example_sentence": "The contralto's dulcet voice resonated through the stone amphitheater, soothing the tense crowd gathered in the piazza."
    },
    982: {
        "phonetic": "/dʌmˈfaʊnd/",
        "pos": "v.",
        "vi_meaning": "Làm chết lặng, làm sửng sốt",
        "example_sentence": "The astronomer's revelation that the distant galaxy exhibited impossible orbital mechanics served to dumbfound the astrophysics community."
    },
    983: {
        "phonetic": "/djuːp/",
        "pos": "v.",
        "vi_meaning": "Lừa gạt, đánh lừa",
        "example_sentence": "By forging official government seals and falsifying deeds, the con artist managed to dupe unsuspecting investors into funding fictitious railroad lines."
    },
    984: {
        "phonetic": "/djuːˈplɪsəti/",
        "pos": "n.",
        "vi_meaning": "Tính hai lòng, sự xảo trá",
        "example_sentence": "The declassified memos exposed the cabinet minister's duplicity, showing that he secretly courted foreign monopolists while publicly decrying their predatory practices."
    },
    985: {
        "phonetic": "/djuˈreɪʃn/",
        "pos": "n.",
        "vi_meaning": "Thời lượng, khoảng thời gian tồn tại",
        "example_sentence": "Because the polar night extends for the entire duration of the arctic winter, expedition members must cope with relentless psychological strain."
    },
    986: {
        "phonetic": "/djuˈres/",
        "pos": "n.",
        "vi_meaning": "Sự ép buộc, sự cưỡng ép",
        "example_sentence": "The tribunal nullified the treaty after uncovering evidence that the sovereign had signed under physical duress and imminent threat of bombardment."
    },
    987: {
        "phonetic": "/ˈdjuːtɪfl/",
        "pos": "adj.",
        "vi_meaning": "Tận tụy, làm tròn bổn phận, biết vâng lời",
        "example_sentence": "Throughout four decades of turbulent naval service, the admiral remained a dutiful commander who placed constitutional loyalty above political ambition."
    },
    988: {
        "phonetic": "/dwɔːf/",
        "pos": "v.",
        "vi_meaning": "Làm lu mờ, thu nhỏ lại khi so sánh",
        "example_sentence": "The staggering scale of the transcontinental railway project threatened to dwarf all previous civil engineering achievements in the nation's history."
    },
    989: {
        "phonetic": "/ˈdwɪndl/",
        "pos": "v.",
        "vi_meaning": "Thu hẹp dần, cạn kiệt dần, suy giảm",
        "example_sentence": "As annual rainfall plummeted and aquifer levels dropped, municipal water reserves began to dwindle to precarious thresholds."
    },
    990: {
        "phonetic": "/daɪˈnæmɪk/",
        "pos": "adj.",
        "vi_meaning": "Năng động, luôn biến đổi, năng tiến",
        "example_sentence": "Ecologists increasingly conceptualize estuaries as dynamic transitional biomes whose species diversity depends on continuous tidal fluctuations."
    },
    991: {
        "phonetic": "/ˈɜːθi/",
        "pos": "adj.",
        "vi_meaning": "Mộc mạc, chân chất, có mùi đất",
        "example_sentence": "Chaucer's Canterbury Tales is celebrated for combining courtly romance with the earthy, ribald humor of fourteenth-century English commoners."
    },
    992: {
        "phonetic": "/eb/",
        "pos": "v.",
        "vi_meaning": "Suy thoái dần, rút dần, tàn lụi",
        "example_sentence": "As wartime fervor began to ebb across the republic, citizen assemblies voiced escalating dissatisfaction with heavy taxation and trade restrictions."
    },
    993: {
        "phonetic": "/ɪˈbʌliənt/",
        "pos": "adj.",
        "vi_meaning": "Sôi nổi, hân hoan, tràn đầy năng lượng",
        "example_sentence": "The orchestra delivered an ebullient rendition of the symphony's finale, eliciting a roaring standing ovation from the captivated audience."
    }
}

enriched_data = []
for item in chunk_data:
    order = item["global_order"]
    if order not in enrichments:
        raise ValueError(f"Missing enrichment for word: {item['word']} (order {order})")
    
    enr = enrichments[order]
    enriched_item = {
        "global_order": item["global_order"],
        "word": item["word"],
        "phonetic": enr["phonetic"],
        "pos": enr["pos"],
        "en_meaning": item["en_meaning"],
        "vi_meaning": enr["vi_meaning"],
        "example_sentence": enr["example_sentence"],
        "lesson_name": item["lesson_name"],
        "lesson_order": item["lesson_order"],
        "word_order": item["word_order"]
    }
    enriched_data.append(enriched_item)

with open(output_file, "w", encoding="utf-8") as f:
    json.dump(enriched_data, f, ensure_ascii=False, indent=2)

print(f"Successfully wrote {len(enriched_data)} items to {output_file}")
