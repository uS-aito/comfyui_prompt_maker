"""Task 5.2: ConfigGeneratorService ユニットテスト"""

import pytest
from backend.models.api_models import (
    GenerateRequest,
    GenerateSceneItem,
    GlobalSettingsPayload,
    TechSettingsPayload,
    SceneOverrides,
)
from backend.models.library_models import (
    ComfyUIConfigModel,
    WorkflowConfigParamsModel,
    DefaultPromptsModel,
)


def _make_tech_settings(
    server_address="127.0.0.1:8188",
    client_id="t2i_client",
    workflow_json_path="/path/to/workflow.json",
    image_output_path="/path/to/output",
    library_file_path="/path/to/library.yaml",
    seed_node_id=164,
    batch_size_node_id=22,
    negative_prompt_node_id=174,
    positive_prompt_node_id=257,
    environment_prompt_node_id=303,
    base_positive_prompt="masterpiece, best quality",
    environment_prompt="",
    positive_prompt="",
    negative_prompt="lowres, bad anatomy",
    batch_size=1,
):
    return TechSettingsPayload(
        comfyui_config=ComfyUIConfigModel(
            server_address=server_address,
            client_id=client_id,
        ),
        workflow_config=WorkflowConfigParamsModel(
            workflow_json_path=workflow_json_path,
            image_output_path=image_output_path,
            library_file_path=library_file_path,
            seed_node_id=seed_node_id,
            batch_size_node_id=batch_size_node_id,
            negative_prompt_node_id=negative_prompt_node_id,
            positive_prompt_node_id=positive_prompt_node_id,
            environment_prompt_node_id=environment_prompt_node_id,
            default_prompts=DefaultPromptsModel(
                base_positive_prompt=base_positive_prompt,
                environment_prompt=environment_prompt,
                positive_prompt=positive_prompt,
                negative_prompt=negative_prompt,
                batch_size=batch_size,
            ),
        ),
    )


def _make_global_settings(
    character_name="Hana",
    environment_name="indoor",
    environment_prompt="indoor room, soft lighting",
):
    return GlobalSettingsPayload(
        character_name=character_name,
        environment_name=environment_name,
        environment_prompt=environment_prompt,
    )


def _make_request(scenes=None, character_name="Hana", environment_name="indoor", environment_prompt="indoor room, soft lighting", tech=None):
    if scenes is None:
        scenes = [GenerateSceneItem(template_name="studying", overrides=SceneOverrides())]
    return GenerateRequest(
        global_settings=_make_global_settings(
            character_name=character_name,
            environment_name=environment_name,
            environment_prompt=environment_prompt,
        ),
        tech_settings=tech if tech is not None else _make_tech_settings(),
        scenes=scenes,
    )


class TestConfigGeneratorServiceComfyUIConfig:
    def _service(self):
        from backend.services.config_generator import ConfigGeneratorService
        return ConfigGeneratorService()

    def test_comfyui_config_server_address(self):
        svc = self._service()
        req = _make_request()
        result = svc.generate(req)
        assert result["comfyui_config"]["server_address"] == "127.0.0.1:8188"

    def test_comfyui_config_client_id(self):
        svc = self._service()
        req = _make_request()
        result = svc.generate(req)
        assert result["comfyui_config"]["client_id"] == "t2i_client"


class TestConfigGeneratorServiceWorkflowConfig:
    def _service(self):
        from backend.services.config_generator import ConfigGeneratorService
        return ConfigGeneratorService()

    def test_workflow_config_paths(self):
        svc = self._service()
        req = _make_request()
        result = svc.generate(req)
        wc = result["workflow_config"]
        assert wc["workflow_json_path"] == "/path/to/workflow.json"
        assert wc["image_output_path"] == "/path/to/output"
        assert wc["library_file_path"] == "/path/to/library.yaml"

    def test_workflow_config_node_ids(self):
        svc = self._service()
        req = _make_request()
        result = svc.generate(req)
        wc = result["workflow_config"]
        assert wc["seed_node_id"] == 164
        assert wc["batch_size_node_id"] == 22
        assert wc["negative_prompt_node_id"] == 174
        assert wc["positive_prompt_node_id"] == 257
        assert wc["environment_prompt_node_id"] == 303

    def test_environment_prompt_combines_character_name_and_environment(self):
        svc = self._service()
        req = _make_request(character_name="Hana", environment_prompt="indoor room, soft lighting")
        result = svc.generate(req)
        dp = result["workflow_config"]["default_prompts"]
        assert dp["environment_prompt"] == "Hana indoor room, soft lighting"

    def test_environment_prompt_with_empty_character_name(self):
        svc = self._service()
        req = _make_request(character_name="", environment_prompt="indoor room")
        result = svc.generate(req)
        dp = result["workflow_config"]["default_prompts"]
        assert dp["environment_prompt"] == "indoor room"

    def test_environment_prompt_with_empty_environment_prompt(self):
        svc = self._service()
        req = _make_request(character_name="Hana", environment_prompt="")
        result = svc.generate(req)
        dp = result["workflow_config"]["default_prompts"]
        assert dp["environment_prompt"] == "Hana"

    def test_environment_prompt_both_empty(self):
        svc = self._service()
        req = _make_request(character_name="", environment_prompt="")
        result = svc.generate(req)
        dp = result["workflow_config"]["default_prompts"]
        assert dp["environment_prompt"] == ""

    def test_default_prompts_base_positive_prompt(self):
        svc = self._service()
        tech = _make_tech_settings(base_positive_prompt="masterpiece, best quality")
        req = _make_request(tech=tech)
        result = svc.generate(req)
        dp = result["workflow_config"]["default_prompts"]
        assert dp["base_positive_prompt"] == "masterpiece, best quality"

    def test_default_prompts_negative_prompt(self):
        svc = self._service()
        tech = _make_tech_settings(negative_prompt="lowres, bad anatomy")
        req = _make_request(tech=tech)
        result = svc.generate(req)
        dp = result["workflow_config"]["default_prompts"]
        assert dp["negative_prompt"] == "lowres, bad anatomy"

    def test_default_prompts_batch_size(self):
        svc = self._service()
        tech = _make_tech_settings(batch_size=3)
        req = _make_request(tech=tech)
        result = svc.generate(req)
        dp = result["workflow_config"]["default_prompts"]
        assert dp["batch_size"] == 3


class TestConfigGeneratorServiceScenes:
    def _service(self):
        from backend.services.config_generator import ConfigGeneratorService
        return ConfigGeneratorService()

    def test_scene_name_uses_template_name(self):
        svc = self._service()
        req = _make_request(scenes=[
            GenerateSceneItem(template_name="studying", overrides=SceneOverrides()),
        ])
        result = svc.generate(req)
        assert result["scenes"][0]["name"] == "studying"

    def test_scene_name_uses_override_name_when_set(self):
        svc = self._service()
        req = _make_request(scenes=[
            GenerateSceneItem(template_name="studying", overrides=SceneOverrides(name="custom_name")),
        ])
        result = svc.generate(req)
        assert result["scenes"][0]["name"] == "custom_name"

    def test_scene_uses_override_positive_prompt(self):
        svc = self._service()
        req = _make_request(scenes=[
            GenerateSceneItem(template_name="s", overrides=SceneOverrides(positive_prompt="custom prompt")),
        ])
        result = svc.generate(req)
        assert result["scenes"][0]["positive_prompt"] == "custom prompt"

    def test_scene_uses_default_positive_prompt_when_no_override(self):
        svc = self._service()
        tech = _make_tech_settings(positive_prompt="default positive")
        req = GenerateRequest(
            global_settings=_make_global_settings(),
            tech_settings=tech,
            scenes=[GenerateSceneItem(template_name="s", overrides=SceneOverrides())],
        )
        result = svc.generate(req)
        assert result["scenes"][0]["positive_prompt"] == "default positive"

    def test_scene_omits_positive_prompt_when_both_empty(self):
        svc = self._service()
        tech = _make_tech_settings(positive_prompt="")
        req = GenerateRequest(
            global_settings=_make_global_settings(),
            tech_settings=tech,
            scenes=[GenerateSceneItem(template_name="s", overrides=SceneOverrides())],
        )
        result = svc.generate(req)
        assert "positive_prompt" not in result["scenes"][0]

    def test_scene_override_empty_string_positive_prompt_is_omitted(self):
        svc = self._service()
        tech = _make_tech_settings(positive_prompt="default positive")
        req = GenerateRequest(
            global_settings=_make_global_settings(),
            tech_settings=tech,
            scenes=[GenerateSceneItem(template_name="s", overrides=SceneOverrides(positive_prompt=""))],
        )
        result = svc.generate(req)
        # 空文字で override した場合は omit
        assert "positive_prompt" not in result["scenes"][0]

    def test_scene_uses_override_negative_prompt(self):
        svc = self._service()
        req = _make_request(scenes=[
            GenerateSceneItem(template_name="s", overrides=SceneOverrides(negative_prompt="custom neg")),
        ])
        result = svc.generate(req)
        assert result["scenes"][0]["negative_prompt"] == "custom neg"

    def test_scene_uses_default_negative_prompt_when_no_override(self):
        svc = self._service()
        tech = _make_tech_settings(negative_prompt="lowres, bad anatomy")
        req = GenerateRequest(
            global_settings=_make_global_settings(),
            tech_settings=tech,
            scenes=[GenerateSceneItem(template_name="s", overrides=SceneOverrides())],
        )
        result = svc.generate(req)
        assert result["scenes"][0]["negative_prompt"] == "lowres, bad anatomy"

    def test_scene_omits_negative_prompt_when_both_empty(self):
        svc = self._service()
        tech = _make_tech_settings(negative_prompt="")
        req = GenerateRequest(
            global_settings=_make_global_settings(),
            tech_settings=tech,
            scenes=[GenerateSceneItem(template_name="s", overrides=SceneOverrides())],
        )
        result = svc.generate(req)
        assert "negative_prompt" not in result["scenes"][0]

    def test_scene_uses_override_batch_size(self):
        svc = self._service()
        req = _make_request(scenes=[
            GenerateSceneItem(template_name="s", overrides=SceneOverrides(batch_size=4)),
        ])
        result = svc.generate(req)
        assert result["scenes"][0]["batch_size"] == 4

    def test_scene_uses_default_batch_size_when_no_override(self):
        svc = self._service()
        tech = _make_tech_settings(batch_size=2)
        req = GenerateRequest(
            global_settings=_make_global_settings(),
            tech_settings=tech,
            scenes=[GenerateSceneItem(template_name="s", overrides=SceneOverrides())],
        )
        result = svc.generate(req)
        assert result["scenes"][0]["batch_size"] == 2

    def test_multiple_scenes(self):
        svc = self._service()
        req = _make_request(scenes=[
            GenerateSceneItem(template_name="studying", overrides=SceneOverrides()),
            GenerateSceneItem(template_name="sleeping", overrides=SceneOverrides(batch_size=3)),
        ])
        result = svc.generate(req)
        assert len(result["scenes"]) == 2
        assert result["scenes"][0]["name"] == "studying"
        assert result["scenes"][1]["name"] == "sleeping"
        assert result["scenes"][1]["batch_size"] == 3

    def test_scene_preserves_order(self):
        svc = self._service()
        req = _make_request(scenes=[
            GenerateSceneItem(template_name="a", overrides=SceneOverrides()),
            GenerateSceneItem(template_name="b", overrides=SceneOverrides()),
            GenerateSceneItem(template_name="c", overrides=SceneOverrides()),
        ])
        result = svc.generate(req)
        names = [s["name"] for s in result["scenes"]]
        assert names == ["a", "b", "c"]


class TestConfigGeneratorServiceOutputStructure:
    def _service(self):
        from backend.services.config_generator import ConfigGeneratorService
        return ConfigGeneratorService()

    def test_output_has_required_top_level_keys(self):
        svc = self._service()
        req = _make_request()
        result = svc.generate(req)
        assert "comfyui_config" in result
        assert "workflow_config" in result
        assert "scenes" in result

    def test_scenes_is_list(self):
        svc = self._service()
        req = _make_request()
        result = svc.generate(req)
        assert isinstance(result["scenes"], list)

    def test_workflow_config_has_default_prompts(self):
        svc = self._service()
        req = _make_request()
        result = svc.generate(req)
        assert "default_prompts" in result["workflow_config"]
