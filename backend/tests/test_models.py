"""Task 3.1: ライブラリ系・API レスポンス系 Pydantic モデルのユニットテスト"""

import pytest
from pydantic import ValidationError


# -------------------------------------------------------------------
# library_models
# -------------------------------------------------------------------

class TestLibraryScene:
    def test_full_fields(self):
        from backend.models.library_models import LibraryScene
        scene = LibraryScene(
            name="studying",
            display_name="勉強しているシーン",
            positive_prompt="sitting at desk, studying",
            negative_prompt="blurry",
            batch_size=2,
            preview_image="scenes/studying.jpg",
        )
        assert scene.name == "studying"
        assert scene.display_name == "勉強しているシーン"
        assert scene.positive_prompt == "sitting at desk, studying"
        assert scene.negative_prompt == "blurry"
        assert scene.batch_size == 2
        assert scene.preview_image == "scenes/studying.jpg"

    def test_defaults(self):
        from backend.models.library_models import LibraryScene
        scene = LibraryScene(
            name="s",
            display_name="S",
            positive_prompt="prompt",
        )
        assert scene.negative_prompt == ""
        assert scene.batch_size == 1
        assert scene.preview_image is None

    def test_batch_size_minimum_one(self):
        from backend.models.library_models import LibraryScene
        with pytest.raises(ValidationError):
            LibraryScene(name="s", display_name="S", positive_prompt="p", batch_size=0)

    def test_batch_size_negative_rejected(self):
        from backend.models.library_models import LibraryScene
        with pytest.raises(ValidationError):
            LibraryScene(name="s", display_name="S", positive_prompt="p", batch_size=-1)


class TestLibraryEnvironment:
    def test_full_fields(self):
        from backend.models.library_models import LibraryEnvironment
        env = LibraryEnvironment(
            name="indoor",
            display_name="室内",
            environment_prompt="indoor room, soft lighting",
            thumbnail="thumbnails/indoor.jpg",
        )
        assert env.name == "indoor"
        assert env.display_name == "室内"
        assert env.environment_prompt == "indoor room, soft lighting"
        assert env.thumbnail == "thumbnails/indoor.jpg"

    def test_optional_thumbnail(self):
        from backend.models.library_models import LibraryEnvironment
        env = LibraryEnvironment(
            name="outdoor",
            display_name="屋外",
            environment_prompt="outdoor, sunny",
        )
        assert env.thumbnail is None


class TestComfyUIConfigModel:
    def test_fields(self):
        from backend.models.library_models import ComfyUIConfigModel
        cfg = ComfyUIConfigModel(server_address="127.0.0.1:8188", client_id="t2i_client")
        assert cfg.server_address == "127.0.0.1:8188"
        assert cfg.client_id == "t2i_client"


class TestDefaultPromptsModel:
    def test_full_fields(self):
        from backend.models.library_models import DefaultPromptsModel
        dp = DefaultPromptsModel(
            base_positive_prompt="masterpiece",
            environment_prompt="indoor",
            positive_prompt="sitting",
            negative_prompt="blurry",
            batch_size=3,
        )
        assert dp.base_positive_prompt == "masterpiece"
        assert dp.batch_size == 3

    def test_defaults(self):
        from backend.models.library_models import DefaultPromptsModel
        dp = DefaultPromptsModel(base_positive_prompt="base")
        assert dp.environment_prompt == ""
        assert dp.positive_prompt == ""
        assert dp.negative_prompt == ""
        assert dp.batch_size == 1

    def test_batch_size_minimum_one(self):
        from backend.models.library_models import DefaultPromptsModel
        with pytest.raises(ValidationError):
            DefaultPromptsModel(base_positive_prompt="b", batch_size=0)


class TestWorkflowConfigParamsModel:
    def _make(self, **kwargs):
        from backend.models.library_models import WorkflowConfigParamsModel, DefaultPromptsModel
        defaults = dict(
            workflow_json_path="/path/to/workflow.json",
            image_output_path="/path/to/output",
            library_file_path="/path/to/library.yaml",
            seed_node_id=164,
            batch_size_node_id=22,
            negative_prompt_node_id=174,
            positive_prompt_node_id=257,
            environment_prompt_node_id=303,
            default_prompts=DefaultPromptsModel(base_positive_prompt="base"),
        )
        defaults.update(kwargs)
        return WorkflowConfigParamsModel(**defaults)

    def test_all_fields(self):
        wc = self._make()
        assert wc.workflow_json_path == "/path/to/workflow.json"
        assert wc.seed_node_id == 164
        assert wc.default_prompts.base_positive_prompt == "base"


class TestLibraryTechDefaults:
    def test_fields(self):
        from backend.models.library_models import (
            LibraryTechDefaults, ComfyUIConfigModel, WorkflowConfigParamsModel, DefaultPromptsModel
        )
        ltd = LibraryTechDefaults(
            comfyui_config=ComfyUIConfigModel(server_address="127.0.0.1:8188", client_id="c"),
            workflow_config=WorkflowConfigParamsModel(
                workflow_json_path="/p", image_output_path="/o", library_file_path="/l",
                seed_node_id=1, batch_size_node_id=2, negative_prompt_node_id=3,
                positive_prompt_node_id=4, environment_prompt_node_id=5,
                default_prompts=DefaultPromptsModel(base_positive_prompt="base"),
            ),
        )
        assert ltd.comfyui_config.server_address == "127.0.0.1:8188"


class TestLibraryFile:
    def _make_scene(self):
        from backend.models.library_models import LibraryScene
        return LibraryScene(name="s", display_name="S", positive_prompt="p")

    def _make_env(self):
        from backend.models.library_models import LibraryEnvironment
        return LibraryEnvironment(name="e", display_name="E", environment_prompt="ep")

    def test_full(self):
        from backend.models.library_models import LibraryFile
        lf = LibraryFile(scenes=[self._make_scene()], environments=[self._make_env()])
        assert len(lf.scenes) == 1
        assert len(lf.environments) == 1
        assert lf.default_tech_settings is None

    def test_empty_lists_allowed(self):
        from backend.models.library_models import LibraryFile
        lf = LibraryFile(scenes=[], environments=[])
        assert lf.scenes == []

    def test_with_default_tech_settings(self):
        from backend.models.library_models import (
            LibraryFile, LibraryTechDefaults, ComfyUIConfigModel,
            WorkflowConfigParamsModel, DefaultPromptsModel
        )
        tech = LibraryTechDefaults(
            comfyui_config=ComfyUIConfigModel(server_address="127.0.0.1:8188", client_id="c"),
            workflow_config=WorkflowConfigParamsModel(
                workflow_json_path="/p", image_output_path="/o", library_file_path="/l",
                seed_node_id=1, batch_size_node_id=2, negative_prompt_node_id=3,
                positive_prompt_node_id=4, environment_prompt_node_id=5,
                default_prompts=DefaultPromptsModel(base_positive_prompt="base"),
            ),
        )
        lf = LibraryFile(
            scenes=[self._make_scene()],
            environments=[self._make_env()],
            default_tech_settings=tech,
        )
        assert lf.default_tech_settings is not None
        assert lf.default_tech_settings.comfyui_config.client_id == "c"


# -------------------------------------------------------------------
# api_models
# -------------------------------------------------------------------

class TestSceneTemplateResponse:
    def test_full_fields(self):
        from backend.models.api_models import SceneTemplateResponse
        r = SceneTemplateResponse(
            name="studying",
            display_name="勉強",
            positive_prompt="sitting",
            negative_prompt="blurry",
            batch_size=1,
            preview_image_url="/api/images/scenes/studying.jpg",
        )
        assert r.name == "studying"
        assert r.preview_image_url == "/api/images/scenes/studying.jpg"

    def test_null_preview_image_url(self):
        from backend.models.api_models import SceneTemplateResponse
        r = SceneTemplateResponse(
            name="s", display_name="S", positive_prompt="p",
            negative_prompt="", batch_size=1, preview_image_url=None,
        )
        assert r.preview_image_url is None


class TestEnvironmentResponse:
    def test_full_fields(self):
        from backend.models.api_models import EnvironmentResponse
        r = EnvironmentResponse(
            name="indoor",
            display_name="室内",
            environment_prompt="indoor room",
            thumbnail_url="/api/images/thumbnails/indoor.jpg",
        )
        assert r.thumbnail_url == "/api/images/thumbnails/indoor.jpg"

    def test_null_thumbnail_url(self):
        from backend.models.api_models import EnvironmentResponse
        r = EnvironmentResponse(
            name="e", display_name="E", environment_prompt="ep", thumbnail_url=None,
        )
        assert r.thumbnail_url is None


class TestTechDefaultsResponse:
    def test_fields(self):
        from backend.models.api_models import TechDefaultsResponse
        from backend.models.library_models import (
            ComfyUIConfigModel, WorkflowConfigParamsModel, DefaultPromptsModel
        )
        r = TechDefaultsResponse(
            comfyui_config=ComfyUIConfigModel(server_address="127.0.0.1:8188", client_id="c"),
            workflow_config=WorkflowConfigParamsModel(
                workflow_json_path="/p", image_output_path="/o", library_file_path="/l",
                seed_node_id=1, batch_size_node_id=2, negative_prompt_node_id=3,
                positive_prompt_node_id=4, environment_prompt_node_id=5,
                default_prompts=DefaultPromptsModel(base_positive_prompt="base"),
            ),
        )
        assert r.comfyui_config.client_id == "c"


class TestSceneOverrides:
    def test_all_optional(self):
        from backend.models.api_models import SceneOverrides
        so = SceneOverrides()
        assert so.name is None
        assert so.positive_prompt is None
        assert so.negative_prompt is None
        assert so.batch_size is None

    def test_partial_override(self):
        from backend.models.api_models import SceneOverrides
        so = SceneOverrides(positive_prompt="custom prompt", batch_size=3)
        assert so.positive_prompt == "custom prompt"
        assert so.batch_size == 3

    def test_batch_size_minimum_one(self):
        from backend.models.api_models import SceneOverrides
        with pytest.raises(ValidationError):
            SceneOverrides(batch_size=0)


class TestGenerateSceneItem:
    def test_fields(self):
        from backend.models.api_models import GenerateSceneItem, SceneOverrides
        item = GenerateSceneItem(
            template_name="studying",
            overrides=SceneOverrides(positive_prompt="custom"),
        )
        assert item.template_name == "studying"
        assert item.overrides.positive_prompt == "custom"

    def test_empty_overrides(self):
        from backend.models.api_models import GenerateSceneItem, SceneOverrides
        item = GenerateSceneItem(template_name="s", overrides=SceneOverrides())
        assert item.overrides.batch_size is None


class TestGlobalSettingsPayload:
    def test_fields(self):
        from backend.models.api_models import GlobalSettingsPayload
        gsp = GlobalSettingsPayload(
            character_name="Hana",
            environment_name="indoor",
            environment_prompt="indoor room",
        )
        assert gsp.character_name == "Hana"
        assert gsp.environment_name == "indoor"
        assert gsp.environment_prompt == "indoor room"


class TestTechSettingsPayload:
    def test_fields(self):
        from backend.models.api_models import TechSettingsPayload
        from backend.models.library_models import (
            ComfyUIConfigModel, WorkflowConfigParamsModel, DefaultPromptsModel
        )
        tsp = TechSettingsPayload(
            comfyui_config=ComfyUIConfigModel(server_address="127.0.0.1:8188", client_id="c"),
            workflow_config=WorkflowConfigParamsModel(
                workflow_json_path="/p", image_output_path="/o", library_file_path="/l",
                seed_node_id=1, batch_size_node_id=2, negative_prompt_node_id=3,
                positive_prompt_node_id=4, environment_prompt_node_id=5,
                default_prompts=DefaultPromptsModel(base_positive_prompt="base"),
            ),
        )
        assert tsp.comfyui_config.server_address == "127.0.0.1:8188"


class TestGenerateRequest:
    def _make_tech(self):
        from backend.models.api_models import TechSettingsPayload
        from backend.models.library_models import (
            ComfyUIConfigModel, WorkflowConfigParamsModel, DefaultPromptsModel
        )
        return TechSettingsPayload(
            comfyui_config=ComfyUIConfigModel(server_address="127.0.0.1:8188", client_id="c"),
            workflow_config=WorkflowConfigParamsModel(
                workflow_json_path="/p", image_output_path="/o", library_file_path="/l",
                seed_node_id=1, batch_size_node_id=2, negative_prompt_node_id=3,
                positive_prompt_node_id=4, environment_prompt_node_id=5,
                default_prompts=DefaultPromptsModel(base_positive_prompt="base"),
            ),
        )

    def _make_global(self):
        from backend.models.api_models import GlobalSettingsPayload
        return GlobalSettingsPayload(
            character_name="Hana", environment_name="indoor", environment_prompt="indoor room"
        )

    def test_valid_request(self):
        from backend.models.api_models import GenerateRequest, GenerateSceneItem, SceneOverrides
        req = GenerateRequest(
            global_settings=self._make_global(),
            tech_settings=self._make_tech(),
            scenes=[GenerateSceneItem(template_name="studying", overrides=SceneOverrides())],
        )
        assert len(req.scenes) == 1

    def test_empty_scenes_rejected(self):
        from backend.models.api_models import GenerateRequest
        with pytest.raises(ValidationError):
            GenerateRequest(
                global_settings=self._make_global(),
                tech_settings=self._make_tech(),
                scenes=[],
            )

    def test_multiple_scenes(self):
        from backend.models.api_models import GenerateRequest, GenerateSceneItem, SceneOverrides
        req = GenerateRequest(
            global_settings=self._make_global(),
            tech_settings=self._make_tech(),
            scenes=[
                GenerateSceneItem(template_name="studying", overrides=SceneOverrides()),
                GenerateSceneItem(template_name="sleeping", overrides=SceneOverrides(batch_size=2)),
            ],
        )
        assert len(req.scenes) == 2
        assert req.scenes[1].overrides.batch_size == 2
